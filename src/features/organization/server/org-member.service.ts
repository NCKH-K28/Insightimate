import { prisma } from '@/lib/prisma';
import { ensureCan } from '../utils/authz';

type OrgMemContext = { actorId: string };

export const listOrgMems = async (input: { orgId: string }, ctx: OrgMemContext) => {
  const { orgId } = input;
  await ensureCan('members:list', { kind: 'org', id: orgId, attr: { orgId } }, ctx);

  const members = await prisma.orgMember.findMany({ where: { orgId }, include: { user: true } });
  return { data: members, meta: { total: members.length } };
};

export const addMemberToOrg = async (
  input: { orgId: string; userId: string },
  ctx: OrgMemContext,
) => {
  throw new Error('Not implemented yet');
};

export const removeMemberFromOrg = async (
  input: { orgId: string; userId: string },
  ctx: OrgMemContext,
) => {
  throw new Error('Not implemented yet');
};

export const updateOrgMemberRole = async (
  input: { orgId: string; userId: string; role: 'member' | 'admin' },
  ctx: OrgMemContext,
) => {
  throw new Error('Not implemented yet');
};
