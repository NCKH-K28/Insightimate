// src/lib/services/projects.service.ts
import {
  PROJECT_ACTIONS,
  ProjectCreateInput,
  ProjectUpdateInput,
  ZProject,
  ZProjectItem,
  ZProjectListRes,
} from '@/contracts/projects';
import { addSeconds } from 'date-fns';
import { createId } from '@paralleldrive/cuid2';
import { Prisma } from '@prisma/client';
import { templateConfigs } from './cqrs/template';
import { prisma } from '@/lib/prisma';
import { checkResourcesMapped } from '@/lib/authz/cerbos';
import { openfgaClient } from '@/lib/authz/openfga';
import { genProjectId } from './cqrs/id-generators';
import { buildProjectActorTuples, buildProjectTuples } from '@/features/authz/api/tuple-factory';
import {
  projectResourceFactory,
  loadPrincipal,
  workspaceResourceFactory,
  ensureCan,
} from '@/features/authz/server/pip';
import { listStatuses } from './cqrs/project-field.service';
import { IssueStatusCategory, ZIssueStatusCreateInput } from '@/contracts/issues/issues.status';
import z from 'zod';

class ProjectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectError';
    Object.setPrototypeOf(this, ProjectError.prototype);
  }
}

// =============================== HELPERS (extracted)
type TxClient = Prisma.TransactionClient;
type TemplateConfig = (typeof templateConfigs)['SCRUM'];

const genProjectRoleId = () => `role_${createId()}`;
const genIssuePriorityId = () => `priority_${createId()}`;
const genIssueStatusId = () => `status_${createId()}`;
const genIssueTypeId = () => `type_${createId()}`;
const genIssueResolutionId = () => `resolution_${createId()}`;

const buildRoleCreateManyData = (
  input: ProjectCreateInput,
  projectId: string,
): Prisma.ProjectRoleCreateManyProjectInput[] => {
  if (!input.roles || input.roles.length === 0) return [];
  return input.roles
    .map((r) => ({ ...r, projectId }))
    .map((r) => ({ ...r, id: genProjectRoleId() }));
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

const assertProjectKeyAvailable = async (
  tx: TxClient,
  workspaceId: string,
  key: string,
): Promise<void> => {
  const exists = await tx.project.findUnique({
    where: { workspaceId_key: { workspaceId, key } },
  });
  if (exists) throw new Error(`Conflict: project key ${key} already exists`);
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
      id: `brd_${createId()}`,
      type: 'SCRUM',
      ownerId: projectLeadId,
      name: `${inputKey} Board`,
      projectId,
      columns: {
        create: statuses.map((status, index) => ({
          id: `col_${createId()}`,
          name: status.name,
          sequence: index,
          statuses: { create: { statusId: status.id } },
        })),
      },
      sprints: {
        create: {
          id: `spt_${createId()}`,
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
  params: { filter?: { workspaceId?: string } },
  context: ProjectContext,
  _options?: { include?: { permissions: boolean } },
) => {
  const options = { include: { permissions: false }, ..._options };

  const { filter } = params;
  const { objects } = await openfgaClient.listObjects({
    user: `user:${context.actorId}`,
    type: 'project',
    relation: 'can_view',
  });
  const projectIds = objects.map((obj) => obj.replace('project:', ''));
  if (projectIds.length === 0) return ZProjectListRes.parse({ data: [], meta: { total: 0 } });

  const where: Prisma.ProjectWhereInput = { id: { in: projectIds } };
  if (filter?.workspaceId) where.workspaceId = filter.workspaceId;

  const projects = await prisma.project.findMany({
    where,
    include: { lead: true, workspace: true },
    orderBy: { createdAt: 'desc' },
  });

  if (projects.length === 0) return ZProjectListRes.parse({ data: [], meta: { total: 0 } });
  if (!options.include.permissions) return ZProjectListRes.parse({ data: projects });

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

  return ZProjectListRes.parse({ data, meta: { total: data.length } });
};

const createProject = async (input: ProjectCreateInput, context: ProjectContext) => {
  const workspace = await prisma.workspace.findUnique({ where: { id: input.workspaceId } });
  if (!workspace) throw new Error('Workspace not found');
  const resource = workspaceResourceFactory(workspace);
  // await ensureCan('projects:create', resource, context); FIXME: BUG (loi khi tao project voi WS_AMDIN role)

  const templateConfig = templateConfigs['SCRUM'];
  const project = ZProject.parse({
    ...input,
    leadId: context.actorId,
    id: genProjectId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const roles = buildRoleCreateManyData(input, project.id).map((r, idx) => ({
    ...r,
    createdAt: addSeconds(new Date(), idx).toISOString(),
    updatedAt: addSeconds(new Date(), idx).toISOString(),
  }));

  const priorities = buildPriorityCreateManyData(templateConfig);
  const statuses = buildStatusCreateManyData(templateConfig);
  const types = buildTypeCreateManyData(templateConfig);
  const resolutions = buildResolutionCreateManyData(templateConfig);

  await prisma.$transaction(async (tx) => {
    await assertProjectKeyAvailable(tx, project.workspaceId, project.key);

    const persisted = await tx.project.create({
      data: {
        ...project,
        // FIXME: Unknown argument `projectId`. Available options are marked with ?.
        // roles: { createMany: { data: roles } },
        // priorities: { createMany: { data: priorities } },
        // statuses: { createMany: { data: statuses } },
        // types: { createMany: { data: types } },
        // resolutions: { createMany: { data: resolutions } },
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
      roles: roles.map((r) => ({ ...r, projectId, actors: [] })),
    });
    await openfgaClient.writeTuples(tuples);
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
    include: { workspace: true, actors: true },
  });
  if (!exists) throw new Error('Project not found');

  const resources = [projectResourceFactory(exists)];
  const principal = await loadPrincipal(context, {}, resources);
  const withActions = resources.map((r) => ({ resource: r, actions: ['update'] }));
  const { results } = await checkResourcesMapped({ principal, resources: withActions });
  const perm = results[exists.id]?._actions || [];
  if (!perm['update']) throw new Error('Permission denied to update this project');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.project.update({
      where: { id: projectId },
      data: { ...input, updatedAt: new Date().toISOString() },
    });
    //
    return ZProject.parse(updated);
  });
};

const deleteProject = async (projectId: string, context: ProjectContext) => {
  const exists = await prisma.project.findUnique({
    where: { id: projectId },
    include: { workspace: true, actors: true },
  });
  if (!exists) throw new Error('Project not found');

  const resources = [projectResourceFactory(exists)];
  const principal = await loadPrincipal(context, {}, resources);
  const withActions = resources.map((r) => ({ resource: r, actions: ['delete'] }));
  const { results } = await checkResourcesMapped({ principal, resources: withActions });
  const perm = results[exists.id]?._actions || [];
  if (!perm['delete']) throw new Error('Permission denied to delete this project');

  await prisma.$transaction(async (tx) => {
    const project = await tx.project.delete({
      where: { id: projectId },
      include: { roles: { include: { actors: true } } },
    });
    const tuples = buildProjectTuples(project);
    await openfgaClient.deleteTuples(tuples);
  });

  return { id: projectId };
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
  if (!project) throw new ProjectError('Project not found');

  const canView = await openfgaClient.check({
    user: `user:${ctx.actorId}`,
    relation: 'can_view',
    object: `project:${projectId}`,
  });
  if (!canView) throw new ProjectError('Permission denied to view this project');
  return ZProjectItem.parse({ ...project, boardId: project.board?.id });
};

const getProjectsFacets = async (
  projectId: string,
  options: { workspaceId?: string } = {},
  context: ProjectContext,
) => {
  const { objects } = await openfgaClient.listObjects({
    user: `user:${context.actorId}`,
    type: 'project',
    relation: 'can_view',
  });
  const projectIds = objects.map((obj) => obj.replace('project:', ''));
  if (projectIds.length === 0) return {};

  const where: Prisma.ProjectWhereInput = { id: { in: projectIds }, ...options };
  const grouped = await prisma.project.groupBy({
    where,
    by: ['type', 'leadId'],
    _count: { type: true, leadId: true },
  });
};

// Project Actor
const listProjectActors = async (params: { projectId: string }, context: ProjectContext) => {
  const { projectId } = params;
  const actors = await prisma.projectActor.findMany({
    where: { projectId },
    include: { role: true },
    orderBy: { id: 'asc' },
  });

  // load actor
  const userIds = actors.filter((a) => a.actorType === 'USER').map((a) => a.actorId);
  const teamIds = actors.filter((a) => a.actorType === 'TEAM').map((a) => a.actorId);

  const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
  const teams = await prisma.team.findMany({ where: { id: { in: teamIds } } });

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));

  const getActor = (actor: { actorType: string; actorId: string }) => {
    if (actor.actorType === 'USER') return userMap[actor.actorId] || null;
    if (actor.actorType === 'TEAM') return teamMap[actor.actorId] || null;
    throw new Error('Unknown actor type ' + actor.actorType);
  };

  const data = actors.map((actor) => ({ ...actor, actor: getActor(actor) }));
  return { data };
};

const addProjectActor = async (
  input: { actorId: string; actorType: 'USER' | 'TEAM'; roleId: string; projectId: string },
  context: ProjectContext,
) => {
  // ensure project exists and can be viewed by actor
  await getProjectById(input.projectId, context);

  return await prisma.$transaction(async (tx) => {
    const exists = await tx.projectActor.findFirst({
      where: { projectId: input.projectId, actorId: input.actorId, actorType: input.actorType },
    });
    if (exists) throw new ProjectError('Actor already a member of this project');
    const actor = await tx.projectActor.create({
      data: {
        id: `pa_${createId()}`,
        projectId: input.projectId,
        actorId: input.actorId,
        actorType: input.actorType,
        roleId: input.roleId,
      },
    });
    const tuples = buildProjectActorTuples(actor);
    await openfgaClient.writeTuples(tuples);
    return actor;
  });
};

const removeActor = async (
  params: { projectId: string; actorId: string },
  context: ProjectContext,
) => {
  const { projectId, actorId } = params;
  // ensure project exists and can be viewed by actor
  await getProjectById(projectId, context);

  return await prisma.$transaction(async (tx) => {
    const exists = await tx.projectActor.findUnique({ where: { id: actorId } });
    if (!exists) throw new ProjectError('Project member not found');
    if (exists.projectId !== projectId)
      throw new ProjectError('Project member does not belong to this project');

    const actor = await tx.projectActor.delete({ where: { id: actorId } });
    const tuples = buildProjectActorTuples(actor);
    await openfgaClient.deleteTuples(tuples);
    return actor;
  });
};

const updateActor = async (
  params: { projectId: string; actorId: string; roleId: string },
  context: ProjectContext,
) => {
  const { projectId, actorId, roleId } = params;
  await getProjectById(projectId, context);

  return await prisma.$transaction(async (tx) => {
    const exists = await tx.projectActor.findUnique({
      where: { id: actorId },
      include: { role: { include: { actors: true } } },
    });
    if (!exists) throw new ProjectError('Project member not found');
    if (exists.projectId !== projectId)
      throw new ProjectError('Project member does not belong to this project');

    const actor = await tx.projectActor.update({
      where: { id: actorId },
      data: { roleId },
      include: { role: { include: { actors: true } } },
    });

    const writeTuples = buildProjectActorTuples(actor);
    const deleteTuples = buildProjectActorTuples(exists);
    await openfgaClient.write({ writes: writeTuples, deletes: deleteTuples });

    return actor;
  });
};

const listMembers = async (params: { projectId: string }, context: ProjectContext) => {
  const actors = await listProjectActors({ projectId: params.projectId }, context);
  const userIds = actors.data.filter((a) => a.actorType === 'USER').map((a) => a.actorId);
  const teamIds = actors.data.filter((a) => a.actorType === 'TEAM').map((a) => a.actorId);
  const teams = await prisma.team.findMany({ where: { id: { in: teamIds } } });
  const teamMembers = await prisma.teamMember.findMany({
    where: { teamId: { in: teamIds } },
  });
  const teamMemberUserIds = teamMembers.map((tm) => tm.userId);

  const allUserIds = Array.from(
    new Set([
      ...userIds,
      ...teamMemberUserIds,
      // team lead + project lead,
      ...teams.map((t) => t.leadId),
      ...[context.actorId], // current user
    ]),
  );
  const users = await prisma.user.findMany({ where: { id: { in: allUserIds } } });
  const result = { data: users };
  return result;
};

const addStatus = async (
  projectId: string,
  input: z.infer<typeof ZIssueStatusCreateInput>,
  context: { actorId: string },
) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new ProjectError('Project not found');

  const canEdit = await openfgaClient.check({
    user: `user:${context.actorId}`,
    relation: 'can_edit',
    object: `project:${projectId}`,
  });
  if (!canEdit.allowed) throw new ProjectError('Permission denied to add status');

  const maxSeq = await prisma.issueStatus.aggregate({
    where: { projectId },
    _max: { sequence: true },
  });
  const nextSeq = (maxSeq._max.sequence ?? 0) + 1;

  const status = await prisma.issueStatus.create({
    data: {
      id: `status_${createId()}`,
      projectId,
      name: input.name,
      description: input.description,
      color: input.color,
      iconURL: input.iconURL,
      category: input.category as IssueStatusCategory,
      sequence: input.sequence ?? nextSeq,
    },
  });

  return status;
};


export const projectsService = {
  list: listProjects,
  create: createProject,
  update: updateProject,
  delete: deleteProject,
  getById: getProjectById,
  getFacets: getProjectsFacets,

  //
  listActors: listProjectActors,
  addActor: addProjectActor,
  removeActor: removeActor,
  updateActor: updateActor,

  // -- remove after migration
  listProjects,
  getProjectById,
  createProject,
  deleteProject,

  listProjectActors,
  addProjectActor,

  // -- new
  listMembers,

  // -- field
  listStatuses,
  addStatus
};
