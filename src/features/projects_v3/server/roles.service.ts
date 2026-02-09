import { createId } from '@paralleldrive/cuid2';
import { ProjectRole, ProjectRoleCreateInput, ZProjectRole } from '@/contracts/projects';
import { openfgaClient } from '@/lib/authz/clients/openfga';
import { prisma } from '@/lib/prisma';
import { projectsService } from './projects.service';
import { buildProjectRoleTuples } from '@/lib/authz/tuple-factory';

const genProjectRoleId = () => `role_${createId()}`;

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
  await projectsService.getById(input.projectId, ctx); // ensure project exists and actor has access
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

// === Read
const listProjectRoles = async (projectId: string, ctx: { actorId: string }) => {
  await projectsService.getById(projectId, ctx); // get and throw if not found or no access

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
  await projectsService.getById(exist.projectId, ctx); // get and throw if not found or no access
  return ZProjectRole.parse(exist);
};

export const rolesService = {
  // Write
  createProjectRole,
  deleteProjectRole,
  // Read
  listProjectRoles,
  getProjectRoleById,
};
