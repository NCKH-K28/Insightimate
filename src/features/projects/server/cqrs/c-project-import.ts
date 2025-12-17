import {
  PROJECT_ROLE_PERMISSION_KEYS,
  ProjectImport,
  ZProjectImportWithLogic,
} from '@/contracts/projects';
import { ProjectContext } from '../types';
import { prisma } from '@/lib/prisma';
import { remapProjectImportIds } from '../../utils';
import { assertProjectKeyAvailable } from '../projects.service';
import { buildProjectActorTuples, buildProjectTuples } from '@/features/authz/api/tuple-factory';
import { openfgaClient } from '@/lib/authz/openfga';
import { createDefaultBoard } from '@/features/boards/server/cqrs';
import { genIssueResolutionId, genProjectActorId } from '../../configs/id-generators';
import omit from 'lodash/omit';

export const importProject = async (
  params: { workspaceId: string; data: ProjectImport },
  context: ProjectContext,
) => {
  const { workspaceId } = params;

  // 1) Validate schema + logic (duplicate ids, ref integrity...)
  const parsed = ZProjectImportWithLogic.parse(params.data);

  // 2) giữ invariant như createProject
  parsed.leadId = context.actorId; // FIXME: handle leadId in schema
  if (parsed.leadId !== context.actorId) {
    throw new Error('Project lead must be the actor importing the project');
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) throw new Error('Workspace not found');

  // 3) remap ids (project/roles/types/priorities/statuses/actors/issues refs)
  const { remapped: data } = remapProjectImportIds(parsed);

  const now = new Date();

  const projectId = await prisma.$transaction(async (tx) => {
    // --- basic conflicts
    await assertProjectKeyAvailable(tx, workspaceId, data.key);

    const actorRows = data.actors.map((a) => ({
      id: genProjectActorId(),
      projectId: data.id,
      actorId: a.actorId,
      actorType: a.actorType,
      roleId: a.roleId,
    }));

    // default resousoltion
    const resolutions = [
      { id: genIssueResolutionId(), name: 'Done', projectId: data.id },
      { id: genIssueResolutionId(), name: 'Backlog', projectId: data.id },
    ];
    const _resolutions = resolutions.map((r) => omit(r, 'projectId'));

    // items without projectid
    const _roles = data.roles.map((r) => omit(r, 'projectId'));
    const _types = data.types.map((t) => omit(t, 'projectId'));
    const _priorities = data.priorities.map((p) => omit(p, 'projectId'));
    const _statuses = data.statuses.map((s) => omit(s, 'projectId'));
    const _actors = actorRows.map((a) => omit(a, 'projectId'));
    const _issues = data.issues.map((i) => ({
      ...omit(i, 'projectId', 'resolutionId'),
      assigneeId: null,
      dueDate: i.dueDate ? new Date(i.dueDate) : null,
      startDate: i.startDate ? new Date(i.startDate) : null,
      reporterId: data.leadId,
      resolutionId: resolutions[0].id,
    }));

    // --- create project (ID MỚI)
    await tx.project.create({
      data: {
        id: data.id,
        type: 'SOFTWARE',
        workspaceId,
        key: data.key,
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        leadId: data.leadId,
        createdAt: now,
        updatedAt: now,
        roles: { createMany: { data: _roles } },
        types: { createMany: { data: _types } },
        priorities: { createMany: { data: _priorities } },
        statuses: { createMany: { data: _statuses } },
        actors: { createMany: { data: _actors } },
        resolutions: { createMany: { data: _resolutions } },
        issues: { createMany: { data: _issues } },
      },
    });

    await createDefaultBoard(tx, {
      projectId: data.id,
      projectLeadId: data.leadId,
      inputKey: data.key,
      statuses: data.statuses,
      issues: data.issues,
    });

    const projectTuples = buildProjectTuples({
      ...data,
      workspaceId,
      roles: data.roles.map((r) => ({ ...r, projectId: data.id, actors: [] })),
      permissions: Object.values(PROJECT_ROLE_PERMISSION_KEYS),
    });

    await openfgaClient.writeTuples(projectTuples);

    if (actorRows.length) {
      const actorTuples = actorRows.flatMap((a) => buildProjectActorTuples(a as any));
      await openfgaClient.writeTuples(actorTuples);
    }

    return data.id;
  });

  return await prisma.project.findUniqueOrThrow({ where: { id: projectId } });
};
