import { executeTransaction, prisma } from '@/lib/prisma';
import { allowedOrgsPerms } from '../utils/authz';
import { buildOrganizationMemberTuples } from '@/lib/authz/tuple-factory';
import { openfgaClient } from '@/lib/authz/clients';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { enqueueFgaJob, processFgaJob } from './enqueue-fga-job';

type OrgMemContext = { actorId: string };

const list = async (input: { orgId: string }, ctx: OrgMemContext) => {
  const { orgId } = input;
  const members = await prisma.orgMember.findMany({
    where: { orgId },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  });

  const resources = members.map(({ id, orgId, userId, role }) => ({
    kind: 'org_member' as const,
    id,
    attr: { orgId, userId, role },
  }));

  const acts = ['delete', 'assign_role'];
  const permsByResourceId = await allowedOrgsPerms(ctx, resources, acts);

  const data = members.map((m) => ({
    ...m,
    _me: { perms: permsByResourceId[m.id] ?? [] }, // FIX key
  }));

  return { data, meta: { total: members.length } };
};

const remove = async (input: { orgId: string; userId: string }, ctx: OrgMemContext) => {
  const member = await prisma.orgMember.findUnique({
    where: { orgId_userId: { orgId: input.orgId, userId: input.userId } }, // cần unique index
  });
  if (!member) return null;

  await prisma.orgMember.delete({
    where: { orgId_userId: { orgId: input.orgId, userId: input.userId } },
  });

  try {
    const tuples = buildOrganizationMemberTuples(member);
    await openfgaClient.deleteTuples(tuples);
  } catch (err) {
    logger.error(err, 'OpenFGA deleteTuples failed after removing member');
  }

  return { ok: true };
};

const assign = async (
  input: { orgId: string; userId: string; role: 'ORG_MEMBER' | 'ORG_ADMIN' | 'ORG_OWNER' },
  ctx: OrgMemContext,
  client: Prisma.TransactionClient = prisma,
) => {
  // TODO: check permission "assign role" ở đây trước khi update.
  return executeTransaction(client, async (tx) => {
    const orgId_userId = { orgId: input.orgId, userId: input.userId };
    const mem = await tx.orgMember.findUnique({ where: { orgId_userId } });
    if (!mem) throw new Error('Member not found');

    const updated = await tx.orgMember.update({
      where: { orgId_userId },
      data: { role: input.role },
    });

    try {
      const oldTuples = buildOrganizationMemberTuples(mem);
      const newTuples = buildOrganizationMemberTuples(updated);
      await openfgaClient.write({ deletes: oldTuples, writes: newTuples });
    } catch (err) {
      logger.error(err, 'OpenFGA write failed after assigning role to member');
    }

    return updated;
  });
};

const add = async (
  input: { orgId: string; userId: string; role: 'ORG_MEMBER' | 'ORG_ADMIN' | 'ORG_OWNER' },
  ctx: OrgMemContext,
  client: Prisma.TransactionClient = prisma,
) => {
  return executeTransaction(client, async (tx) => {
    const orgId_userId = { orgId: input.orgId, userId: input.userId };
    const existing = await tx.orgMember.findUnique({ where: { orgId_userId } });
    if (existing) throw new Error('User is already a member of the organization');

    const newMember = await tx.orgMember.create({
      data: { orgId: input.orgId, userId: input.userId, role: input.role },
    });

    try {
      const tuples = buildOrganizationMemberTuples(newMember);
      await openfgaClient.writeTuples(tuples);
    } catch (err) {
      logger.error(err, 'OpenFGA writeTuples failed after adding member');
    }

    return newMember;
  });
};

const leave = async (
  input: { orgId: string; userId: string },
  ctx: OrgMemContext,
  client: Prisma.TransactionClient = prisma,
) => {
  if (input.orgId !== ctx.actorId) {
    throw new Error('Cannot leave organization on behalf of another user');
  }
  const result = await executeTransaction(client, async (tx) => {
    const orgId_userId = { orgId: input.orgId, userId: input.userId };
    const mem = await tx.orgMember.delete({ where: { orgId_userId }, include: { user: true } });
    if (!mem) throw new Error('Failed to leave organization');

    await tx.orgInvitation.deleteMany({ where: { orgId: input.orgId, email: mem.user.email } });
    const job = await enqueueFgaJob(tx, {
      kind: 'org_member_leave',
      member: { id: mem.id, orgId: mem.orgId, userId: mem.userId, role: mem.role },
    });

    return { ok: true, fgaJobId: job.id };
  });

  const { fgaJobId } = result;
  try {
    await processFgaJob(fgaJobId);
  } catch (err) {
    logger.error(err, 'OpenFGA processAuthorizationModel failed after member leave');
  }
};

export const orgMemberService = { add, list, remove, leave, assign };
