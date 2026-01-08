import {
  WorkspaceCreateInput,
  ZWorkspace,
  Workspace,
  ZWorkspaceMember,
  WorkspaceMember,
  WORKSPACE_ACTIONS,
  ZWorkspaceItem,
  WorkspaceActionKey,
  WorkspaceUpdateInput,
} from '@/contracts/workspaces';
import { prisma } from '@/lib/prisma';
import { init } from '@paralleldrive/cuid2';
import { openfgaClient } from '@/lib/auth/authz/openfga';
import { cerbosEdge, mapCerbosActionsToBooleans } from '@/lib/auth/authz/cerbos';
import get from 'lodash/get';
import { WorkspacePermissionError, WorkspaceNotFoundError } from '@/lib/http/errors';
import { loadPrincipal, workspaceResourceFactory } from '@/features/authz/server/pip';
import { buildWorkspaceTuples } from '@/features/authz/api/tuple-factory';

// =============================== Utilities
const genWorkspaceCuid = init({ length: 10, fingerprint: 'workspace' });
const genWorkspaceIdWithPrefix = (prefix: 'wp' = 'wp') => `${prefix}_${genWorkspaceCuid()}`;
export const genWorkspaceMemberId = (prefix: 'wsm' = 'wsm') => `${prefix}_${genWorkspaceCuid()}`;

const ensureCanViewWorkspace = async (workspaceId: string, actorId: string) => {
  const canView = await openfgaClient.check({
    user: `user:${actorId}`,
    object: `workspace:${workspaceId}`,
    relation: 'can_view',
  });
  if (canView.allowed !== true) throw new WorkspacePermissionError();
};

const isWorkspaceActionAllowed = (action: WorkspaceActionKey, perm: unknown): boolean => {
  return get(perm, action) === true;
};

const buildWorkspace = (input: { name: string; ownerId: string }): Workspace => {
  const ws: Workspace = {
    id: genWorkspaceIdWithPrefix('wp'),
    name: input.name,
    ownerId: input.ownerId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    removedAt: null,
  };
  return ZWorkspace.parse(ws);
};

const buildWorkspaceMember = (input: {
  userId: string;
  workspaceId: string;
  role: 'WS_ADMIN' | 'WS_MEMBER';
}): WorkspaceMember => {
  const member: WorkspaceMember = {
    id: genWorkspaceMemberId(),
    userId: input.userId,
    workspaceId: input.workspaceId,
    role: input.role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return ZWorkspaceMember.parse(member);
};

type WorkspaceServiceContext = { actorId: string };

// =============================== WORKSPACE - READ Operations
const getWorkspaceById = async (
  id: string,
  context: { actorId: string },
  options?: { include?: { permissions?: boolean } },
) => {
  const include = { permissions: false, ...options?.include };

  const ws = await prisma.workspace.findUnique({ where: { id }, include: { owner: true } });
  if (!ws) throw new WorkspaceNotFoundError();

  await ensureCanViewWorkspace(id, context.actorId);

  if (!include.permissions) return ZWorkspaceItem.parse(ws);

  const resource = workspaceResourceFactory(ws);
  const principal = await loadPrincipal(context, { workspaceId: id });

  const actions = Array.from(WORKSPACE_ACTIONS);
  const check = await cerbosEdge.checkResource({ principal, resource, actions });

  const permissions = mapCerbosActionsToBooleans(check.actions);

  return ZWorkspaceItem.parse({ ...ws, permissions });
};

const listWorkspacesOfUser = async (userId: string) => {
  const { objects } = await openfgaClient.listObjects({
    type: 'workspace',
    user: `user:${userId}`,
    relation: 'can_view',
  });

  const ids = objects.map((obj) => obj.replace('workspace:', ''));
  const workspaces = await prisma.workspace.findMany({
    where: { id: { in: ids } },
    include: { owner: true },
  });

  const data = workspaces.map((ws) => ZWorkspace.parse(ws));
  return { data };
};

// =============================== WORKSPACE - WRITE Operations
const createWorkspace = async (input: WorkspaceCreateInput, context: WorkspaceServiceContext) => {
  const workspace = buildWorkspace({ name: input.name, ownerId: context.actorId });
  const member = buildWorkspaceMember({
    userId: workspace.ownerId,
    workspaceId: workspace.id,
    role: 'WS_ADMIN',
  });

  await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({ data: { ...workspace } });
    const mem = await tx.workspaceMember.create({ data: member });

    const tuples = buildWorkspaceTuples({ ...ws, members: [mem] });
    await openfgaClient.writeTuples(tuples);
  });

  return workspace;
};

const updateWorkspaceById = async (
  id: string,
  input: Partial<WorkspaceUpdateInput>,
  context: WorkspaceServiceContext,
  options?: { include?: { permissions?: boolean } },
) => {
  const workspace = await getWorkspaceById(id, context, { include: { permissions: true } });
  if (!isWorkspaceActionAllowed('update', workspace.permissions)) {
    throw new WorkspacePermissionError();
  }

  const updatedWorkspace = await prisma.workspace.update({
    where: { id },
    data: { ...input, updatedAt: new Date() },
  });

  if (!options?.include?.permissions) return ZWorkspaceItem.parse(updatedWorkspace);
  const resource = workspaceResourceFactory(updatedWorkspace);
  const principal = await loadPrincipal(context, { workspaceId: id });

  const actions = Array.from(WORKSPACE_ACTIONS);
  const check = await cerbosEdge.checkResource({ principal, resource, actions });

  const permissions = mapCerbosActionsToBooleans(check.actions);
  return ZWorkspaceItem.parse({ ...updatedWorkspace, permissions });
};

const archiveWorkspace = async (id: string, context: WorkspaceServiceContext) => {
  const workspace = await getWorkspaceById(id, context, { include: { permissions: true } });
  if (!isWorkspaceActionAllowed('delete', workspace.permissions)) {
    throw new WorkspacePermissionError();
  }
  await prisma.workspace.update({ where: { id }, data: { removedAt: new Date() } });
  return { id };
};

const restoreWorkspace = async (id: string, context: WorkspaceServiceContext) => {
  const workspace = await getWorkspaceById(id, context, { include: { permissions: true } });
  if (!isWorkspaceActionAllowed('delete', workspace.permissions)) {
    throw new WorkspacePermissionError();
  }
  await prisma.workspace.update({ where: { id }, data: { removedAt: null } });
  return { id };
};

const deleteWorkspace = async (id: string, context: WorkspaceServiceContext) => {
  const workspace = await getWorkspaceById(id, context, { include: { permissions: true } });
  if (!isWorkspaceActionAllowed('delete', workspace.permissions)) {
    throw new WorkspacePermissionError();
  }
  await prisma.workspace.delete({ where: { id } });
  return { id };
};

// =============================== EXPORTS
export const workspaceService = {
  getById: getWorkspaceById,
  list: listWorkspacesOfUser,
  updateById: updateWorkspaceById,
  create: createWorkspace,
  archive: archiveWorkspace,
  restore: restoreWorkspace,
  delete: deleteWorkspace,
};
