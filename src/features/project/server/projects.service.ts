import {
  PROJECT_ACTIONS,
  PROJECT_ROLE_PERMISSION_KEYS,
  ProjectCreateInput,
  ProjectUpdateInput,
  ZProject,
  ZProjectItem,
  ZProjectListRes,
} from '@/contracts/project';
import { addSeconds } from 'date-fns';
import { Prisma } from '@prisma/client';
import { templateConfigs } from '@/features/project/configs/template';
import { prisma } from '@/lib/prisma';
import { checkResourcesMapped } from '@/lib/authz/clients/cerbos';
import { openfgaClient } from '@/lib/authz/clients/openfga';
import {
  genBoardId,
  genColumnId,
  genProjectId,
  genSprintId,
  genIssuePriorityId,
  genIssueResolutionId,
  genIssueStatusId,
  genIssueTypeId,
  genProjectRoleId,
} from '@/features/project/configs/id-generators';
import { projectResourceFactory, loadPrincipal } from '../utils/authz';

import { buildProjectTuples } from '@/lib/authz/tuple-factory';
import { ProjectError } from '@/lib/http/errors';
import { emitActivity } from '@/features/activity/server/emit-activity';
import { getDefaultRoles } from '@/features/project/constants/default-roles';

// =============================== HELPERS
type TxClient = Prisma.TransactionClient;
type TemplateConfig = (typeof templateConfigs)['SCRUM'];

type PrismaRoleCreateInput = Omit<Prisma.ProjectRoleCreateManyInput, 'permissions'> & {
  permissions: string[];
};

const buildRoleCreateManyData = (
  input: ProjectCreateInput,
  projectId: string,
): PrismaRoleCreateInput[] => {
  const roles = input.roles && input.roles.length > 0 ? input.roles : getDefaultRoles();

  return roles.map((r) => ({ ...r, projectId })).map((r) => ({ ...r, id: genProjectRoleId() }));
};

const buildPriorityCreateManyData = (
  templateConfig: TemplateConfig,
): Prisma.IssuePriorityCreateManyProjectInput[] => {
  const { priorities } = templateConfig;
  if (!priorities || priorities.length === 0) return [];
  return priorities.map((p) => ({ ...p, id: genIssuePriorityId() }));
};

const buildStatusCreateManyData = (
  templateConfig: TemplateConfig,
): Prisma.IssueStatusCreateManyProjectInput[] => {
  const { statuses } = templateConfig;
  if (!statuses || statuses.length === 0) return [];
  return statuses.map((s) => ({ ...s, id: genIssueStatusId() }));
};

const buildTypeCreateManyData = (
  templateConfig: TemplateConfig,
): Prisma.IssueTypeCreateManyProjectInput[] => {
  const { types } = templateConfig;
  if (!types || types.length === 0) return [];
  return types.map((t) => ({ ...t, id: genIssueTypeId() }));
};

const buildResolutionCreateManyData = (
  templateConfig: TemplateConfig,
): Prisma.IssueResolutionCreateManyProjectInput[] => {
  const { resolutions } = templateConfig;
  if (!resolutions || resolutions.length === 0) return [];
  return resolutions.map((r) => ({ ...r, id: genIssueResolutionId() }));
};

export const assertProjectKeyAvailable = async (
  tx: TxClient,
  orgId: string,
  key: string,
): Promise<void> => {
  const orgId_key = { orgId, key };
  const exists = await tx.project.findUnique({ where: { orgId_key } });
  if (exists) {
    throw new ProjectError('PROJECT_ALREADY_EXISTS', `Conflict: project key ${key} already exists`);
  }
};

const createDefaultBoard = async (
  tx: TxClient,
  params: {
    projectId: string;
    projectLeadId: string;
    inputKey: string;
    statuses: Prisma.IssueStatusCreateManyProjectInput[];
  },
) => {
  const { projectId, projectLeadId, inputKey, statuses } = params;

  const { sprintCounter } = await tx.project.update({
    where: { id: projectId },
    data: { sprintCounter: { increment: 1 } },
    select: { sprintCounter: true },
  });

  return tx.board.create({
    data: {
      id: genBoardId(),
      type: 'SCRUM',
      ownerId: projectLeadId,
      name: `${inputKey} Board`,
      projectId,
      columns: {
        create: statuses.map((status, index) => ({
          id: genColumnId(),
          name: status.name,
          sequence: index,
          statuses: {
            create: { statusId: status.id },
          },
        })),
      },
      sprints: {
        create: {
          id: genSprintId(),
          name: `Sprint ${sprintCounter}`,
          sequence: 0,
          state: 'FUTURE',
        },
      },
    },
  });
};

// =============================== SERVICES
type ProjectContext = { actorId: string };

const listProjects = async (
  params: { filter?: { orgId?: string } },
  context: ProjectContext,
  _options?: { include?: { permissions: boolean } },
) => {
  const options = { include: { permissions: false }, ..._options };

  const { filter } = params;
  const { objects } = await openfgaClient.listObjects({
    user: `user:${context.actorId}`,
    type: 'proj',
    relation: 'read',
  });
  const projectIds = objects.map((obj) => obj.replace('proj:', ''));
  if (projectIds.length === 0) {
    return ZProjectListRes.parse({ data: [], meta: { total: 0, page: 1, pageSize: 10 } });
  }

  const where: Prisma.ProjectWhereInput = { id: { in: projectIds } };
  if (filter?.orgId) where.orgId = filter.orgId;

  const projects = await prisma.project.findMany({
    where,
    include: { lead: true, organization: true },
    orderBy: { createdAt: 'desc' },
  });

  if (projects.length === 0) {
    return ZProjectListRes.parse({ data: [], meta: { total: 0, page: 1, pageSize: 10 } });
  }
  if (!options.include.permissions) {
    return ZProjectListRes.parse({
      data: projects,
      meta: { total: projects.length, page: 1, pageSize: projects.length },
    });
  }

  // === With permissions
  const resources = projects.map(projectResourceFactory);
  const principal = await loadPrincipal(context, {}, resources);
  const actions = Array.from(PROJECT_ACTIONS);

  const resourcesWithActions = resources.map((r) => ({ resource: r, actions }));
  const { results } = await checkResourcesMapped({
    resources: resourcesWithActions,
    principal: principal,
  });

  const data = projects.map((p) => ({ ...p, permissions: results[p.id]?._actions }));

  return ZProjectListRes.parse({
    data,
    meta: { total: data.length, page: 1, pageSize: data.length },
  });
};

const createProject = async (input: ProjectCreateInput, context: ProjectContext) => {
  if (input.leadId !== context.actorId) {
    throw new Error('Project lead must be the actor creating the project');
  }

  const organization = await prisma.organization.findUnique({ where: { id: input.orgId } });
  if (!organization) throw new Error('Organization not found');

  const templateConfig = templateConfigs['SCRUM'];
  const project = ZProject.parse({
    ...input,
    id: genProjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const roles = buildRoleCreateManyData(input, project.id).map((r, idx) => ({
    ...r,
    createdAt: addSeconds(new Date(), idx),
    updatedAt: addSeconds(new Date(), idx),
  }));

  const priorities = input.priorities?.length
    ? input.priorities.map((p) => ({ ...p, id: genIssuePriorityId() }))
    : buildPriorityCreateManyData(templateConfig);

  const statuses = input.statuses?.length
    ? input.statuses.map((s) => ({ ...s, id: genIssueStatusId() }))
    : buildStatusCreateManyData(templateConfig);

  const types = input.types?.length
    ? input.types.map((t) => ({ ...t, id: genIssueTypeId() }))
    : buildTypeCreateManyData(templateConfig);

  const resolutions = buildResolutionCreateManyData(templateConfig);

  await prisma.$transaction(async (tx) => {
    await assertProjectKeyAvailable(tx, project.orgId, project.key);

    const persisted = await tx.project.create({
      data: {
        ...project,
      },
    });

    const projectId = persisted.id;

    await Promise.all([
      tx.projectRole.createMany({ data: roles.map((r) => ({ ...r, projectId })) }),
      tx.issuePriority.createMany({ data: priorities.map((p) => ({ ...p, projectId })) }),
      tx.issueStatus.createMany({ data: statuses.map((s) => ({ ...s, projectId })) }),
      tx.issueType.createMany({ data: types.map((t) => ({ ...t, projectId })) }),
      tx.issueResolution.createMany({ data: resolutions.map((r) => ({ ...r, projectId })) }),
    ]);

    await createDefaultBoard(tx, {
      projectId,
      projectLeadId: project.leadId,
      inputKey: input.key,
      statuses,
    });

    // --- authz ---
    const tuples = buildProjectTuples({
      ...project,
      roles: roles.map((r) => ({ ...r, id: r.id as string, actors: [] })),
      permissions: Object.values(PROJECT_ROLE_PERMISSION_KEYS),
    });
    await openfgaClient.writeTuples(tuples);
  });

  // --- activity feed ---
  emitActivity({
    orgId: project.orgId,
    projectId: project.id,
    actorId: context.actorId,
    action: 'CREATED',
    entity: 'PROJECT',
    entityId: project.id,
    entityKey: project.key,
    entityTitle: project.name,
  });

  return project;
};

const updateProject = async (
  projectId: string,
  input: Partial<ProjectUpdateInput>,
  context: ProjectContext,
) => {
  const exists = await prisma.project.findUnique({
    where: { id: projectId },
    include: { organization: true, actors: true },
  });
  if (!exists) throw new ProjectError('PROJECT_NOT_FOUND', 'Project not found');

  const resources = [projectResourceFactory(exists)];
  const principal = await loadPrincipal(context, {}, resources);
  const withActions = resources.map((r) => ({ resource: r, actions: ['update'] }));
  const { results } = await checkResourcesMapped({ principal, resources: withActions });
  const perm = results[exists.id]?._actions || [];
  if (!perm['update']) throw new ProjectError('PROJECT_PERMISSION_DENIED', 'Permission denied');

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.project.update({
      where: { id: projectId },
      data: { ...input, updatedAt: new Date().toISOString() },
    });
    return ZProject.parse(updated);
  });

  // --- activity feed ---
  const changes = Object.keys(input)
    .filter((k) => (input as any)[k] !== (exists as any)[k])
    .map((k) => ({ field: k, old: (exists as any)[k], new: (input as any)[k] }));

  emitActivity({
    orgId: exists.orgId,
    projectId: exists.id,
    actorId: context.actorId,
    action: 'UPDATED',
    entity: 'PROJECT',
    entityId: exists.id,
    entityKey: exists.key,
    entityTitle: exists.name,
    changes,
  });

  return result;
};

const deleteProject = async (projectId: string, context: ProjectContext) => {
  const exists = await prisma.project.findUnique({
    where: { id: projectId },
    include: { organization: true, actors: true },
  });
  if (!exists) throw new ProjectError('PROJECT_NOT_FOUND', 'Project not found');

  const resources = [projectResourceFactory(exists)];
  const principal = await loadPrincipal(context, {}, resources);
  const withActions = resources.map((r) => ({ resource: r, actions: ['delete'] }));
  const { results } = await checkResourcesMapped({ principal, resources: withActions });
  const perm = results[exists.id]?._actions || [];
  if (!perm['delete']) throw new ProjectError('PROJECT_PERMISSION_DENIED', 'Permission denied');

  await prisma.$transaction(async (tx) => {
    // --- activity feed (emit before cascade deletes related data) ---
    await tx.activityEvent.create({
      data: {
        orgId: exists.orgId,
        projectId: null, // project is about to be deleted
        actorId: context.actorId,
        actorType: 'USER',
        action: 'DELETED',
        entity: 'PROJECT',
        entityId: projectId,
        entityKey: exists.key,
        entityTitle: exists.name,
      },
    });

    const project = await tx.project.delete({
      where: { id: projectId },
      include: { roles: { include: { actors: true } } },
    });

    const roles = project.roles.map((r) => {
      const permJSON = JSON.parse(JSON.stringify(r.permissions));
      const permissions = Array.isArray(permJSON) ? permJSON : [];
      return { ...r, permissions };
    });

    const tuples = buildProjectTuples({
      ...project,
      roles,
      permissions: Object.values(PROJECT_ROLE_PERMISSION_KEYS),
    });
    await openfgaClient.deleteTuples(tuples);
  });

  return { id: projectId };
};

const getFacets = async (params: { filter?: { orgId?: string } }, context: ProjectContext) => {
  const { objects } = await openfgaClient.listObjects({
    user: `user:${context.actorId}`,
    type: 'proj',
    relation: 'read',
  });
  const projectIds = objects.map((obj) => obj.replace('proj:', ''));
  if (projectIds.length === 0) return { types: [], leads: [] };

  const where: Prisma.ProjectWhereInput = { id: { in: projectIds } };
  if (params.filter?.orgId) where.orgId = params.filter.orgId;

  const [typeRows, leadRows] = await Promise.all([
    prisma.project.groupBy({ by: ['type'], where, _count: { _all: true } }),
    prisma.project.groupBy({ by: ['leadId'], where, _count: { _all: true } }),
  ]);

  const leadIds = leadRows.map((r) => r.leadId);
  const leads = await prisma.user.findMany({
    where: { id: { in: leadIds } },
    select: { id: true, name: true, email: true, avatar: true },
  });
  const leadMap = new Map(leads.map((l) => [l.id, l]));

  return {
    types: typeRows.map((r) => ({ value: r.type, label: r.type, count: r._count._all })),
    leads: leadRows.map((r) => ({
      value: r.leadId,
      label: leadMap.get(r.leadId) || null,
      count: r._count._all,
    })),
  };
};

const getProjectById = async (projectId: string, ctx: ProjectContext) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      lead: true,
      types: true,
      priorities: true,
      statuses: true,
      resolutions: true,
      board: { select: { id: true } },
    },
  });
  if (!project) throw new ProjectError('PROJECT_NOT_FOUND');

  const accessible = await openfgaClient.listObjects({
    user: `user:${ctx.actorId}`,
    relation: 'read',
    type: 'proj',
    contextualTuples: [],
  });
  const canView = accessible.objects.includes(`proj:${projectId}`);
  if (!canView) throw new ProjectError('PROJECT_PERMISSION_DENIED');
  return ZProjectItem.parse({ ...project, boardId: project.board?.id });
};

const listStatuses = async (projectId: string, ctx: ProjectContext) => {
  await getProjectById(projectId, ctx); // Auth check
  const statuses = await prisma.issueStatus.findMany({
    where: { projectId },
    orderBy: { sequence: 'asc' },
  });
  return { items: statuses, total: statuses.length };
};

const createStatus = async (projectId: string, input: any, ctx: ProjectContext) => {
  await updateProject(projectId, {}, ctx); // Auth check: requires update permission
  const id = input?.id ?? genIssueStatusId();
  const { name, description, iconURL, color, category, sequence } = input;
  const newStatus = await prisma.issueStatus.create({
    data: {
      id,
      projectId,
      name,
      description,
      iconURL,
      color,
      category,
      sequence: sequence ?? 0,
    },
  });
  return newStatus;
};

const deleteStatus = async (projectId: string, statusId: string, ctx: ProjectContext) => {
  await updateProject(projectId, {}, ctx); // Auth check: requires update permission
  await prisma.issueStatus.delete({ where: { id: statusId, projectId } });
  return { message: 'Issue status deleted successfully' };
};

const listTypes = async (projectId: string, ctx: ProjectContext) => {
  await getProjectById(projectId, ctx); // Auth check
  const types = await prisma.issueType.findMany({
    where: { projectId },
    orderBy: { sequence: 'asc' },
  });
  return { items: types, total: types.length };
};

const createType = async (projectId: string, input: any, ctx: ProjectContext) => {
  await updateProject(projectId, {}, ctx); // Auth check: requires update permission
  const id = input?.id ?? genIssueTypeId();
  const { name, description, iconURL, color, sequence } = input;
  const newType = await prisma.issueType.create({
    data: {
      id,
      projectId,
      name,
      description,
      iconURL,
      color,
      sequence: sequence ?? 0,
      hierarchy: 0,
    },
  });
  return newType;
};

const deleteType = async (projectId: string, typeId: string, ctx: ProjectContext) => {
  await updateProject(projectId, {}, ctx); // Auth check: requires update permission
  
  // Protect against deleting the last type
  const typeCount = await prisma.issueType.count({ where: { projectId } });
  if (typeCount <= 1) {
    throw new ProjectError('CANNOT_DELETE_LAST_TYPE', 'Cannot delete the last issue type for the project');
  }

  await prisma.issueType.delete({ where: { id: typeId, projectId } });
  return { message: 'Issue type deleted successfully' };
};

// =============================== ARCHIVE / UNARCHIVE

const archive = async (projectId: string, ctx: ProjectContext) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { organization: true, actors: true },
  });
  if (!project) throw new ProjectError('PROJECT_NOT_FOUND', 'Project not found');

  const resources = [projectResourceFactory(project)];
  const principal = await loadPrincipal(ctx, {}, resources);
  const withActions = resources.map((r) => ({ resource: r, actions: ['update'] }));
  const { results } = await checkResourcesMapped({ principal, resources: withActions });
  const perm = results[project.id]?._actions || [];
  if (!perm['update']) throw new ProjectError('PROJECT_PERMISSION_DENIED', 'Permission denied');

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { archived: true, updatedAt: new Date() },
  });

  emitActivity({
    orgId: project.orgId,
    projectId: project.id,
    actorId: ctx.actorId,
    action: 'UPDATED',
    entity: 'PROJECT',
    entityId: project.id,
    entityKey: project.key,
    entityTitle: project.name,
    changes: [{ field: 'archived', old: false, new: true }],
  });

  return ZProject.parse(updated);
};

const unarchive = async (projectId: string, ctx: ProjectContext) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { organization: true, actors: true },
  });
  if (!project) throw new ProjectError('PROJECT_NOT_FOUND', 'Project not found');

  const resources = [projectResourceFactory(project)];
  const principal = await loadPrincipal(ctx, {}, resources);
  const withActions = resources.map((r) => ({ resource: r, actions: ['update'] }));
  const { results } = await checkResourcesMapped({ principal, resources: withActions });
  const perm = results[project.id]?._actions || [];
  if (!perm['update']) throw new ProjectError('PROJECT_PERMISSION_DENIED', 'Permission denied');

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { archived: false, updatedAt: new Date() },
  });

  emitActivity({
    orgId: project.orgId,
    projectId: project.id,
    actorId: ctx.actorId,
    action: 'UPDATED',
    entity: 'PROJECT',
    entityId: project.id,
    entityKey: project.key,
    entityTitle: project.name,
    changes: [{ field: 'archived', old: true, new: false }],
  });

  return ZProject.parse(updated);
};

// =============================== FAVORITES

const addFavorite = async (projectId: string, ctx: ProjectContext) => {
  // Auth check: ensure caller can view the project
  await getProjectById(projectId, ctx);

  const favorite = await prisma.projectFavorite.upsert({
    where: { userId_projectId: { userId: ctx.actorId, projectId } },
    create: { userId: ctx.actorId, projectId },
    update: {},
  });

  return favorite;
};

const removeFavorite = async (projectId: string, ctx: ProjectContext) => {
  // Auth check: ensure caller can view the project
  await getProjectById(projectId, ctx);

  await prisma.projectFavorite.deleteMany({
    where: { userId: ctx.actorId, projectId },
  });

  return { message: 'Favorite removed' };
};

const listFavorites = async (ctx: ProjectContext) => {
  const favorites = await prisma.projectFavorite.findMany({
    where: { userId: ctx.actorId },
    include: {
      project: {
        include: { lead: true, organization: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return { data: favorites };
};

// =============================== IDENTIFIER CHECK

const isKeyAvailable = async (orgId: string, key: string): Promise<{ available: boolean }> => {
  const existing = await prisma.project.findUnique({
    where: { orgId_key: { orgId, key } },
    select: { id: true },
  });
  return { available: !existing };
};

// =============================== SUMMARY / ANALYTICS

const getSummary = async (projectId: string, ctx: ProjectContext) => {
  await getProjectById(projectId, ctx); // Auth check

  const statuses = await prisma.issueStatus.findMany({
    where: { projectId },
    select: { id: true, category: true },
  });

  const statusMap = new Map(statuses.map((s) => [s.id, s.category]));

  const [totalIssues, byStatus, memberCount] = await Promise.all([
    prisma.issue.count({ where: { projectId } }),
    prisma.issue.groupBy({
      by: ['statusId'],
      where: { projectId },
      _count: { _all: true },
    }),
    prisma.projectActor.count({ where: { projectId } }),
  ]);

  const categoryCounts: Record<string, number> = {
    TODO: 0,
    IN_PROGRESS: 0,
    DONE: 0,
  };

  for (const row of byStatus) {
    const category = statusMap.get(row.statusId);
    if (category && category in categoryCounts) {
      categoryCounts[category] += row._count._all;
    }
  }

  return {
    totalIssues,
    todoIssues: categoryCounts.TODO,
    inProgressIssues: categoryCounts.IN_PROGRESS,
    completedIssues: categoryCounts.DONE,
    memberCount,
  };
};

export const projectsService = {
  list: listProjects,
  create: createProject,
  update: updateProject,
  delete: deleteProject,
  getById: getProjectById,
  getFacets,
  listStatuses,
  createStatus,
  deleteStatus,
  listTypes,
  createType,
  deleteType,
  archive,
  unarchive,
  addFavorite,
  removeFavorite,
  listFavorites,
  isKeyAvailable,
  getSummary,
};
