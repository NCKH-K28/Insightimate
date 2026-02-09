import { prisma } from '@/lib/prisma';
import uniqby from 'lodash/uniqBy';
import { CerbosPrincipal } from '@/lib/authz/clients';

type ProjectResource = { kind: 'proj'; id: string; attr?: Record<string, any> };
type Resource = ProjectResource;

export const projectResourceFactory = (project: {
  id: string;
  orgId?: string;
  leadId?: string;
}): ProjectResource => ({
  kind: 'proj',
  id: project.id,
  attr: {
    ...(project.orgId && { orgId: project.orgId }),
    project: {
      leadId: project.leadId || '',
    },
  },
});

export const loadPrincipal = async (
  context: { actorId: string },
  _options: Record<string, unknown> = {},
  resources: Resource[] = [],
): Promise<CerbosPrincipal> => {
  const { actorId } = context;
  const roles: string[] = ['user'];
  const attr: Record<string, string | number | boolean> = {};

  // Resource-based roles: fetch org membership for projects
  const orgIds = new Set<string>();
  for (const r of resources) {
    if (r.kind === 'proj' && r.attr?.orgId) {
      orgIds.add(r.attr.orgId);
    }
  }

  if (orgIds.size > 0) {
    const orgMembers = await prisma.orgMember.findMany({
      where: { orgId: { in: Array.from(orgIds) }, userId: actorId },
      select: { orgId: true, role: true },
    });
    orgMembers.forEach((m) => {
      roles.push(`org:${m.orgId}#${m.role}`);
      roles.push(m.role); // Add raw role for simpler policy matching
    });
  }

  const uniqueRoles = uniqby(roles, (r) => r);
  return { id: actorId, roles: uniqueRoles, attr };
};
