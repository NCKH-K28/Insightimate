import { prisma } from '@/lib/prisma';
import { openfgaClient } from '@/lib/authz/clients/openfga';
import { genProjectActorId } from '@/features/project/configs/id-generators';
import { projectsService } from './projects.service';
import { buildProjectActorTuples } from '@/lib/authz/tuple-factory';
import { ProjectError, PROJECT_ERROR_CODES } from '@/lib/http/errors/proj.error';

type ActorContext = { actorId: string };

const listProjectActors = async (params: { projectId: string }) => {
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
  context: ActorContext,
) => {
  // ensure project exists and can be viewed by actor
  await projectsService.getById(input.projectId, context);

  return await prisma.$transaction(async (tx) => {
    const exists = await tx.projectActor.findFirst({
      where: { projectId: input.projectId, actorId: input.actorId, actorType: input.actorType },
    });
    if (exists)
      throw new ProjectError(
        PROJECT_ERROR_CODES.PROJECT_ALREADY_EXISTS,
        'Actor already a member of this project',
      );
    const actor = await tx.projectActor.create({
      data: {
        id: genProjectActorId(),
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

const removeProjectActor = async (
  params: { projectId: string; actorId: string },
  context: ActorContext,
) => {
  const { projectId, actorId } = params;
  // ensure project exists and can be viewed by actor
  await projectsService.getById(projectId, context);

  return await prisma.$transaction(async (tx) => {
    const exists = await tx.projectActor.findUnique({ where: { id: actorId } });
    if (!exists)
      throw new ProjectError(PROJECT_ERROR_CODES.PROJECT_NOT_FOUND, 'Project member not found');
    if (exists.projectId !== projectId)
      throw new ProjectError(
        PROJECT_ERROR_CODES.PROJECT_INVALID_INPUT,
        'Project member does not belong to this project',
      );

    const actor = await tx.projectActor.delete({ where: { id: actorId } });
    const tuples = buildProjectActorTuples(actor);
    await openfgaClient.deleteTuples(tuples);
    return actor;
  });
};

const updateProjectActor = async (
  params: { projectId: string; actorId: string; roleId: string },
  context: ActorContext,
) => {
  const { projectId, actorId, roleId } = params;
  await projectsService.getById(projectId, context);

  return await prisma.$transaction(async (tx) => {
    const exists = await tx.projectActor.findUnique({
      where: { id: actorId },
      include: { role: { include: { actors: true } } },
    });
    if (!exists)
      throw new ProjectError(PROJECT_ERROR_CODES.PROJECT_NOT_FOUND, 'Project member not found');
    if (exists.projectId !== projectId)
      throw new ProjectError(
        PROJECT_ERROR_CODES.PROJECT_INVALID_INPUT,
        'Project member does not belong to this project',
      );

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

export const actorsService = {
  listProjectActors,
  addProjectActor,
  updateProjectActor,
  removeProjectActor,
};
