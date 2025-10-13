import { CerbosCheckResourcesRequest, cerbosEdge } from '@/lib/authz/cerbos';
import { prisma } from '@/lib/prisma';
import z from 'zod';

const ZStringArrayOptional = z.array(z.string()).optional();
type WorkspaceAttr = { id: string; ownerId: string };
type ProjectAttr = { id: string; leadId: string; workspace?: WorkspaceAttr };
type WsMemberAttr = { id: string; userId: string; role: string; workspace: WorkspaceAttr };

type WorkspaceResource = { kind: 'workspace'; id: string; attr?: WorkspaceAttr };
type ProjectResource = { kind: 'project'; id: string; attr?: ProjectAttr };
type WsMemberResource = { kind: 'workspace_member'; id: string; attr?: WsMemberAttr };
type AnyResource = WorkspaceResource | ProjectResource | WsMemberResource;

export const loadPrincipal = async (
  context: { actorId: string },
  params: { workspaceId?: string; projectId?: string },
  _resources: AnyResource[] = [],
) => {
  const resources = [..._resources];
  // old roles -- remove later
  if (params.workspaceId) resources.push({ kind: 'workspace', id: params.workspaceId });
  if (params.projectId) resources.push({ kind: 'project', id: params.projectId });

  const { actorId } = context;
  const roles: string[] = ['user'];
  const attr: Record<string, any> = {};

  // Resource-based roles
  const workspaceIds: Set<string> = new Set();
  const projectIds: Set<string> = new Set();
  const wsMemberIds: Set<string> = new Set();
  for (const r of resources) {
    if (r.kind === 'workspace') workspaceIds.add(r.id);
    else if (r.kind === 'project') projectIds.add(r.id);
    else if (r.kind === 'workspace_member') wsMemberIds.add(r.id);
  }

  if (wsMemberIds.size > 0) {
    const wsMembers = await prisma.workspaceMember.findMany({
      where: { id: { in: Array.from(wsMemberIds) }, userId: actorId },
      select: { workspaceId: true },
    });
    const wsIds = new Set(wsMembers.map((m) => m.workspaceId));
    wsIds.forEach((id) => workspaceIds.add(id));
  }

  if (workspaceIds.size > 0) {
    const wsMembers = await prisma.workspaceMember.findMany({
      where: { workspaceId: { in: Array.from(workspaceIds) }, userId: actorId },
      select: { workspaceId: true, role: true },
    });
    wsMembers.forEach((m) => roles.push(`workspace:${m.workspaceId}#${m.role}`));
  }

  if (projectIds.size > 0) {
    const actors = await prisma.projectActor.findMany({
      where: { projectId: { in: Array.from(projectIds) }, actorId },
    });
    actors.forEach((a) => roles.push(`project:${a.projectId}#PROJ_MEMBER`));
  }

  // Remove duplicates
  const uniqueRoles = Array.from(new Set(roles));
  return { id: actorId, roles: uniqueRoles, attr };
};

// Helpers
export const workspaceResourceFactory = (w: WorkspaceAttr) => {
  return { kind: 'workspace' as const, id: w.id, attr: w };
};

export const projectResourceFactory = (p: ProjectAttr) => {
  return { kind: 'project' as const, id: p.id, attr: p };
};

export const workspaceMemberResourceFactory = (m: WsMemberAttr) => {
  return { kind: 'workspace_member' as const, id: m.id, attr: m };
};

export const ensureCan = async (
  action: string,
  resource: AnyResource,
  context: { actorId: string },
  throwOnDenied = true,
) => {
  const principal = await loadPrincipal(context, {}, [resource]);
  const decision = await cerbosEdge.checkResource({ principal, actions: [action], resource });
  const isAllowed = decision.isAllowed(action);
  if (!isAllowed && throwOnDenied)
    throw new Error(`Permission denied to ${action} on this resource`);
  return decision;
};

export const ensureCanMany = async (
  actions: string[],
  resource: AnyResource,
  context: { actorId: string },
  throwOnDenied = true,
) => {
  const principal = await loadPrincipal(context, {}, [resource]);
  const decision = await cerbosEdge.checkResource({ principal, actions, resource });
  if (throwOnDenied) {
    const denied = actions.filter((action) => !decision.isAllowed(action));
    if (denied.length > 0)
      throw new Error(`Permission denied to ${denied.join(', ')} on this resource`);
  }
  return decision;
};
