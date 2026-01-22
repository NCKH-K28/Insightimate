import { cerbosEdge } from '@/lib/auth/authz/cerbos';
import { prisma } from '@/lib/prisma';

type OrgAttr = { id: string; ownerId: string };
type OrgMemberAttr = { id: string; userId: string; role: string; org: OrgAttr };
type ProjectAttr = { id: string; leadId: string; org?: OrgAttr };

type OrgResource = { kind: 'org'; id: string; attr?: Record<string, any> };
type OrgMemberResource = { kind: 'org_member'; id: string; attr?: Record<string, any> };
type ProjectResource = { kind: 'project'; id: string; attr?: ProjectAttr };
type AnyResource = OrgResource | OrgMemberResource | ProjectResource;

export type PrincipalParams = { orgId?: string; projectId?: string };
export const loadPrincipal = async (
  context: { actorId: string },
  resources: AnyResource[] = [],
) => {
  const { actorId } = context;
  const roles: string[] = ['user'];
  const attr: Record<string, any> = {};

  // Resource-based roles
  const orgIds = new Set<string>();
  const orgMemberIds = new Set<string>();
  const projIds = new Set<string>();
  for (const r of resources) {
    if (r.kind === 'org') orgIds.add(r.id);
    else if (r.kind === 'org_member') orgMemberIds.add(r.id);
    else if (r.kind === 'project') projIds.add(r.id);
    else throw new Error(`Unknown resource kind: ${(r as any).kind}`);
  }

  if (orgIds.size > 0) {
    const orgMembers = await prisma.orgMember.findMany({
      where: { orgId: { in: Array.from(orgIds) }, userId: actorId },
      select: { orgId: true, role: true },
    });
    orgMembers.forEach((m) => roles.push(`org:${m.orgId}#${m.role}`));
  }

  if (orgMemberIds.size > 0) {
  }

  if (projIds.size > 0) {
    const actors = await prisma.projectActor.findMany({
      where: { projectId: { in: Array.from(projIds) }, actorId },
    });
    actors.forEach((a) => roles.push(`project:${a.projectId}#PROJ_MEMBER`));
  }

  // Remove duplicates
  const uniqueRoles = Array.from(new Set(roles));
  return { id: actorId, roles: uniqueRoles, attr };
};

// Helpers
export const orgResourceFactory = (o: OrgAttr) => {
  return { kind: 'org' as const, id: o.id, attr: o };
};

export const orgMemberResourceFactory = (m: OrgMemberAttr) => {
  return { kind: 'org_member' as const, id: m.id, attr: m };
};

export const projectResourceFactory = (p: ProjectAttr) => {
  return { kind: 'project' as const, id: p.id, attr: p };
};

export const ensureCan = async (
  action: string,
  resource: AnyResource,
  context: { actorId: string },
  throwOnDenied = true,
) => {
  const principal = await loadPrincipal(context, [resource]);
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
  const principal = await loadPrincipal(context, [resource]);
  const decision = await cerbosEdge.checkResource({ principal, actions, resource });
  if (throwOnDenied) {
    const denied = actions.filter((action) => !decision.isAllowed(action));
    if (denied.length > 0) {
      throw new Error(`Permission denied to ${denied.join(', ')} on this resource`);
    }
  }
  return decision;
};
