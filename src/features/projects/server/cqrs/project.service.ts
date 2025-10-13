import { PROJECT_ACTIONS, ZProject, ZProjectItem, ZProjectListRes } from '@/contracts/projects';
import { openfgaClient } from '@/lib/authz/openfga';
import { ProjectNotFoundError, ProjectPermissionError } from '@/lib/http/errors';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { merge } from 'lodash';
import {
  ensureCan,
  loadPrincipal,
  projectResourceFactory,
  workspaceResourceFactory,
} from '../../../features/authz/server/pip';
import { checkResourcesMapped } from '@/lib/authz/cerbos';
import { addSeconds } from 'date-fns';
import { buildProjectTuples } from '../../../features/authz/authz';
import { createDefaultBoard } from '../board';
import {
  buildRoleCreateManyData,
  buildPriorityCreateManyData,
  buildStatusCreateManyData,
  buildTypeCreateManyData,
  buildResolutionCreateManyData,
} from './data-builders';
import { genProjectId } from './id-generators';
import { templateConfigs } from './template';
import { assertProjectKeyAvailable } from './validation';

type ProjectParams = { projectId: string };
type ProjectContext = { actorId: string };

export const getProject = async (params: ProjectParams, context: ProjectContext) => {
  const { projectId } = params;
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
  if (!project) throw new ProjectNotFoundError();

  const canView = await openfgaClient.check({
    user: `user:${context.actorId}`,
    relation: 'can_view',
    object: `project:${projectId}`,
  });
  if (!canView) throw new ProjectPermissionError('Permission denied to view this project');
  return ZProjectItem.parse({ ...project, boardId: project.board?.id });
};

export const listProjects = async (
  _query: {
    include?: { lead?: boolean; permissions?: boolean };
    filter?: { workspaceId?: string };
  },
  context: ProjectContext,
) => {
  const query = merge({ include: { lead: false, permissions: false } }, _query || {});
  const { include, filter } = query;

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

  if (!include.permissions) return ZProjectListRes.parse({ data: projects });

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

export const createProject = async (
  input: Prisma.ProjectCreateInput,
  context: ProjectContext,
  _query: { include?: { lead?: boolean; permissions?: boolean } } = {},
) => {
  const workspace = await prisma.workspace.findUnique({ where: { id: input.workspaceId } });
  if (!workspace) throw new Error('Workspace not found');
  const resource = workspaceResourceFactory(workspace);
  await ensureCan('projects:create', resource, context);

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
