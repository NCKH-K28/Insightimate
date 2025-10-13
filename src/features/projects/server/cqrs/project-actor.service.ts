import { prisma } from '@/lib/prisma';
import { merge } from 'lodash';
import { createId } from '@paralleldrive/cuid2';

import { ProjectActorAddInput } from '@/contracts/projects';
import { openfgaClient } from '@/lib/authz/openfga';
import { getProject } from './project.service';
import { buildProjectActorTuples } from '@/features/authz/api/tuple-factory';

export const genProjectActorId = () => `pa_${createId()}`;

type ProjectActorParams = { projectId: string };
type ProjectActorContext = { actorId: string };

export const listActors = async (
  projectId: string,
  _query: { include?: { actor?: boolean } },
  _context: ProjectActorContext,
) => {
  const query = merge({ include: { actor: false } }, _query || {});

  const actors = await prisma.projectActor.findMany({
    where: { projectId },
    include: { role: true },
    orderBy: { id: 'asc' },
  });

  if (!query?.include?.actor) return { data: actors };

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

export const createActor = async (
  input: ProjectActorAddInput,
  _params: ProjectActorParams,
  _context: ProjectActorContext,
) => {
  const { projectId } = _params;

  return await prisma.$transaction(async (tx) => {
    const exists = await tx.projectActor.findFirst({
      where: { projectId, actorId: input.actorId, actorType: input.actorType },
    });
    if (exists) throw new Error('Actor already a member of this project');
    const actor = await tx.projectActor.create({
      data: {
        id: genProjectActorId(),
        projectId,
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

export const removeActor = async (
  params: { projectId: string; actorId: string },
  context: ProjectActorContext,
) => {
  const { projectId, actorId } = params;
  await getProject({ projectId }, context);

  return await prisma.$transaction(async (tx) => {
    const exists = await tx.projectActor.findUnique({ where: { id: actorId } });
    if (!exists) throw new Error('Project member not found');
    if (exists.projectId !== projectId)
      throw new Error('Project member does not belong to this project');

    const actor = await tx.projectActor.delete({ where: { id: actorId } });
    const tuples = buildProjectActorTuples(actor);
    await openfgaClient.deleteTuples(tuples);
    return actor;
  });
};

export const updateActor = async (
  params: { projectId: string; actorId: string },
  input: { roleId: string },
  context: ProjectActorContext,
) => {
  const { projectId, actorId } = params;
  await getProject({ projectId }, context);

  return await prisma.$transaction(async (tx) => {
    const exists = await tx.projectActor.findUnique({
      where: { id: actorId },
      include: { role: { include: { actors: true } } },
    });
    if (!exists) throw new Error('Project member not found');
    if (exists.projectId !== projectId)
      throw new Error('Project member does not belong to this project');

    const actor = await tx.projectActor.update({
      where: { id: actorId },
      data: { roleId: input.roleId },
      include: { role: { include: { actors: true } } },
    });

    const writeTuples = buildProjectActorTuples(actor);
    const deleteTuples = buildProjectActorTuples(exists);
    await openfgaClient.write({ writes: writeTuples, deletes: deleteTuples });

    return actor;
  });
};

// ensure project exists and can be viewed by actor

// // Project Actor
// const listProjectActors = async (params: { projectId: string }, context: ProjectContext) => {
//   const { projectId } = params;
//   const actors = await prisma.projectActor.findMany({
//     where: { projectId },
//     include: { role: true },
//     orderBy: { id: 'asc' },
//   });

//   // load actor
//   const userIds = actors.filter((a) => a.actorType === 'USER').map((a) => a.actorId);
//   const teamIds = actors.filter((a) => a.actorType === 'TEAM').map((a) => a.actorId);

//   const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
//   const teams = await prisma.team.findMany({ where: { id: { in: teamIds } } });

//   const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
//   const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));

//   const getActor = (actor: { actorType: string; actorId: string }) => {
//     if (actor.actorType === 'USER') return userMap[actor.actorId] || null;
//     if (actor.actorType === 'TEAM') return teamMap[actor.actorId] || null;
//     throw new Error('Unknown actor type ' + actor.actorType);
//   };

//   const data = actors.map((actor) => ({ ...actor, actor: getActor(actor) }));
//   return { data };
// };

// const addProjectActor = async (
//   input: { actorId: string; actorType: 'USER' | 'TEAM'; roleId: string; projectId: string },
//   context: ProjectContext,
// ) => {
//   // ensure project exists and can be viewed by actor
//   await getProjectById(input.projectId, context);

//   return await prisma.$transaction(async (tx) => {
//     const exists = await tx.projectActor.findFirst({
//       where: { projectId: input.projectId, actorId: input.actorId, actorType: input.actorType },
//     });
//     if (exists) throw new ProjectError('Actor already a member of this project');
//     const actor = await tx.projectActor.create({
//       data: {
//         id: `pa_${createId()}`,
//         projectId: input.projectId,
//         actorId: input.actorId,
//         actorType: input.actorType,
//         roleId: input.roleId,
//       },
//     });
//     const tuples = buildProjectActorTuples(actor);
//     await openfgaClient.writeTuples(tuples);
//     return actor;
//   });
// };

// const removeActor = async (
//   params: { projectId: string; actorId: string },
//   context: ProjectContext,
// ) => {
//   const { projectId, actorId } = params;
//   // ensure project exists and can be viewed by actor
//   await getProjectById(projectId, context);

//   return await prisma.$transaction(async (tx) => {
//     const exists = await tx.projectActor.findUnique({ where: { id: actorId } });
//     if (!exists) throw new ProjectError('Project member not found');
//     if (exists.projectId !== projectId)
//       throw new ProjectError('Project member does not belong to this project');

//     const actor = await tx.projectActor.delete({ where: { id: actorId } });
//     const tuples = buildProjectActorTuples(actor);
//     await openfgaClient.deleteTuples(tuples);
//     return actor;
//   });
// };

// const updateActor = async (
//   params: { projectId: string; actorId: string; roleId: string },
//   context: ProjectContext,
// ) => {
//   const { projectId, actorId, roleId } = params;
//   await getProjectById(projectId, context);

//   return await prisma.$transaction(async (tx) => {
//     const exists = await tx.projectActor.findUnique({
//       where: { id: actorId },
//       include: { role: { include: { actors: true } } },
//     });
//     if (!exists) throw new ProjectError('Project member not found');
//     if (exists.projectId !== projectId)
//       throw new ProjectError('Project member does not belong to this project');

//     const actor = await tx.projectActor.update({
//       where: { id: actorId },
//       data: { roleId },
//       include: { role: { include: { actors: true } } },
//     });

//     const writeTuples = buildProjectActorTuples(actor);
//     const deleteTuples = buildProjectActorTuples(exists);
//     await openfgaClient.write({ writes: writeTuples, deletes: deleteTuples });

//     return actor;
//   });
// };

// const listMembers = async (params: { projectId: string }, context: ProjectContext) => {
//   const actors = await listProjectActors({ projectId: params.projectId }, context);
//   const userIds = actors.data.filter((a) => a.actorType === 'USER').map((a) => a.actorId);
//   const teamIds = actors.data.filter((a) => a.actorType === 'TEAM').map((a) => a.actorId);
//   const teams = await prisma.team.findMany({ where: { id: { in: teamIds } } });
//   const teamMembers = await prisma.teamMember.findMany({
//     where: { teamId: { in: teamIds } },
//   });
//   const teamMemberUserIds = teamMembers.map((tm) => tm.userId);

//   const allUserIds = Array.from(
//     new Set([
//       ...userIds,
//       ...teamMemberUserIds,
//       // team lead + project lead,
//       ...teams.map((t) => t.leadId),
//       ...[context.actorId], // current user
//     ]),
//   );
//   const users = await prisma.user.findMany({ where: { id: { in: allUserIds } } });
//   const result = { data: users };
//   return result;
// };
