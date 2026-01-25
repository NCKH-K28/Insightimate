import { prisma } from '@/lib/prisma';
import uniqby from 'lodash/uniqBy';
import { cerbosClient, CerbosPrincipal, openfgaClient } from '@/lib/authz/clients';
import { asUser } from '@/lib/authz/tuple-factory';
import { OrgError } from '@/lib/http/errors';

type ActionType = 'read' | 'delete';

export const accessibleOrgs = async (
  input: { action: ActionType },
  context: { actorId: string },
): Promise<string[]> => {
  const res = await openfgaClient.listObjects({
    user: asUser(context.actorId),
    relation: input.action,
    type: 'org',
  });
  const prefix = 'org:';
  const ids = res.objects.map((obj) => obj.slice(prefix.length));
  return ids;
};

export type OrgResource = { kind: 'org'; id: string; attr?: Record<string, string> };
export const loadPrincipal = async (
  context: { actorId: string },
  resources: OrgResource[] = [],
): Promise<CerbosPrincipal> => {
  const { actorId } = context;
  const roles: ('user' | `org:${string}#${string}`)[] = ['user'];
  const attr: Record<string, string | number | boolean> = {};

  // Resource-based roles
  const orgIds = new Set<string>();
  for (const r of resources) {
    if (r.kind === 'org') orgIds.add(r.id);
    else throw new Error(`Unknown resource kind: ${r.kind}`);
  }

  if (orgIds.size > 0) {
    const orgMembers = await prisma.orgMember.findMany({
      where: { orgId: { in: Array.from(orgIds) }, userId: actorId },
      select: { orgId: true, role: true },
    });
    orgMembers.forEach((m) => roles.push(`org:${m.orgId}#${m.role}`));
  }

  // log
  console.log(`Loaded principal for actor ${actorId} with roles: ${roles.join(', ')}`);

  const uniqueRoles = uniqby(roles, (r) => r);
  return { id: actorId, roles: uniqueRoles, attr };
};

export const ensureCan = async (
  action: string,
  resource: OrgResource,
  context: { actorId: string },
) => {
  const principal = await loadPrincipal(context, [resource]);
  const actions = [action];
  const decision = await cerbosClient.checkResource({ principal, actions, resource });
  if (!decision.isAllowed(action)) throw new OrgError('ORG_FORBIDDEN', 'Access denied');
};

export const ensureCanMany = async (
  actions: string[],
  resource: OrgResource,
  context: { actorId: string },
) => {
  const principal = await loadPrincipal(context, [resource]);
  const decision = await cerbosClient.checkResource({ principal, actions, resource });
  const deniedActions = actions.filter((action) => !decision.isAllowed(action));
  if (deniedActions.length > 0) {
    throw new OrgError('ORG_FORBIDDEN', `Access denied for actions: ${deniedActions.join(', ')}`);
  }
};

export const allowedOrgPerms = async (
  context: { actorId: string },
  resource: OrgResource,
  actions: string[] = [],
): Promise<string[]> => {
  const principal = await loadPrincipal(context, [resource]);
  const decision = await cerbosClient.checkResource({ principal, actions, resource });
  return actions.filter((action) => decision.isAllowed(action));
};

export const allowedOrgsPerms = async (
  context: { actorId: string },
  resources: OrgResource[],
  actions: string[] = [],
): Promise<Record<string, string[]>> => {
  if (resources.length === 0) return {};
  const principal = await loadPrincipal(context, resources);
  const resourceActs = resources.map((r) => ({ resource: r, actions }));
  const decisions = await cerbosClient.checkResources({ principal, resources: resourceActs });
  const result: Record<string, string[]> = {};
  decisions.results.forEach((res) => {
    const allowedActions = actions.filter((action) => res.isAllowed(action));
    result[res.resource.id] = allowedActions;
  });
  return result;
};
