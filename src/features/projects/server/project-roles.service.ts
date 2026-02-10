import { createId } from '@paralleldrive/cuid2';
import { ProjectRole, ProjectRoleCreateInput, ZProjectRole } from '@/contracts/project';
import { openfgaClient } from '@/lib/authz/clients/openfga';
import { prisma } from '@/lib/prisma';
import { writeProjectRoles } from './cqrs/c-project-roles-write';
import {
  buildProjectRoleTuples,
  buildProjectActorTuples,
} from '@/features/authz/api/tuple-factory';
import { projectsService } from './projects.service';

const genProjectRoleId = () => `role_${createId()}`;
const genProjectActorId = () => `pactor_${createId()}`;

export const projectRoleFactory = (input: Partial<ProjectRole> & ProjectRoleCreateInput) => {
  const now = new Date().toISOString();
  const data: ProjectRole = {
    id: input.id || genProjectRoleId(),
    name: input.name,
    projectId: input.projectId || '',
    description: input.description || '',
    permissions: input.permissions || [],
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
  return ZProjectRole.parse(data);
};

const jsonValueToObject = (value: any) => {
  return JSON.parse(JSON.stringify(value));
};

// === Write
const createProjectRole = async (input: ProjectRoleCreateInput, ctx: { actorId: string }) => {
  await projectsService.getProjectById(input.projectId, ctx); // ensure project exists and actor has access
  return await prisma.$transaction(async (tx) => {
    const created = await tx.projectRole.create({
      data: projectRoleFactory(input),
      include: { actors: true },
    });
    const tuples = buildProjectRoleTuples({
      ...created,
      permissions: Array.from(jsonValueToObject(created.permissions)),
    });
    if (tuples.length > 0) await openfgaClient.writeTuples(tuples);
    return created;
  });
};

// hard delete
const deleteProjectRole = async (roleId: string, ctx: { actorId: string }) => {
  await getProjectRoleById(roleId, ctx);

  return await prisma.$transaction(async (tx) => {
    const role = await tx.projectRole.findUniqueOrThrow({
      where: { id: roleId },
      include: { actors: true },
    });

    await tx.projectRole.delete({ where: { id: roleId } });
    const tuples = buildProjectRoleTuples({ ...role, permissions: [] });
    await openfgaClient.deleteTuples(tuples);

    return { success: true };
  });
};

// const updateProjectRole = async (
//   roleId: string,
//   input: Partial<ProjectRoleCreateInput>,
//   ctx: { actorId: string },
// ) => {
//   throw new Error('Not implemented yet');
// };

const addMemberToProjectRole = async (
  input: { roleId: string; userId: string },
  context: { actorId: string },
) => {
  const role = await getProjectRoleById(input.roleId, context); // ensure role exists and actor has access

  return await prisma.$transaction(async (tx) => {
    const exist = await tx.projectActor.findFirst({
      where: {
        projectId: role.projectId,
        actorType: 'USER',
        actorId: input.userId,
        roleId: input.roleId,
      },
    });
    if (exist) throw new Error('User is already a member of this role');

    const added = await tx.projectActor.create({
      data: {
        id: genProjectActorId(),
        projectId: role.projectId,
        actorType: 'USER',
        actorId: input.userId,
        roleId: input.roleId,
      },
    });

    const tuples = buildProjectActorTuples(added);
    await openfgaClient.writeTuples(tuples);
    return added;
  });
};

const removeMemberFromProjectRole = async (
  input: { roleId: string; userId: string },
  context: { actorId: string },
) => {
  const role = await getProjectRoleById(input.roleId, context); // ensure role exists and actor has access

  return await prisma.$transaction(async (tx) => {
    const exist = await tx.projectActor.findFirst({
      where: {
        projectId: role.projectId,
        actorType: 'USER',
        actorId: input.userId,
        roleId: input.roleId,
      },
    });
    if (!exist) throw new Error('User is not a member of this role');
    await tx.projectActor.delete({ where: { id: exist.id } });

    const tuples = buildProjectActorTuples(exist);
    await openfgaClient.deleteTuples(tuples);
    return { success: true };
  });
};

// === Read
const listProjectRoles = async (projectId: string, ctx: { actorId: string }) => {
  await projectsService.getProjectById(projectId, ctx); // get and throw if not found or no access

  const roles = await prisma.projectRole.findMany({
    where: { projectId },
    orderBy: [{ createdAt: 'asc' }, { name: 'asc' }],
  });
  const data = roles.map((r) => ZProjectRole.parse(r));
  return { data, meta: { total: roles.length } };
};

const getProjectRoleById = async (roleId: string, ctx: { actorId: string }) => {
  const exist = await prisma.projectRole.findUnique({ where: { id: roleId } });
  if (!exist) throw new Error('Role not found');
  await projectsService.getProjectById(exist.projectId, ctx); // get and throw if not found or no access
  return ZProjectRole.parse(exist);
};

const listProjectActors = async (projectId: string, ctx: { actorId: string }) => {
  await projectsService.getProjectById(projectId, ctx);
  const actors = await prisma.projectActor.findMany({ where: { projectId } });
  const data = actors;
  return { data, meta: { total: actors.length } };
};

const getProjectActorById = async (actorId: string, _ctx: { actorId: string }) => {
  const exist = await prisma.projectActor.findUnique({ where: { id: actorId } });
  if (!exist) throw new Error('Actor not found');
  return exist;
};

export const projectRolesService = {
  // Write
  createProjectRole,
  deleteProjectRole,
  // updateProjectRole,
  addMemberToProjectRole,
  removeMemberFromProjectRole,
  // Read
  listProjectRoles,
  getProjectRoleById,
  listProjectActors,
  getProjectActorById,

  //
  projectRolesWrite: writeProjectRoles,
};
