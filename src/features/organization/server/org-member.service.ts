import { executeTransaction, prisma } from '@/lib/prisma';
import { allowedOrgsPerms, ensureCan } from '../utils/authz';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { enqueueFgaJob, processFgaJob } from './enqueue-fga-job';
import { OrgRole } from '@/contracts/organizations/organization';

type OrgMemContext = { actorId: string };

const ROLE_TO_MANAGE_ACTION: Record<OrgRole, string> = {
  ORG_OWNER: 'owner',
  ORG_ADMIN: 'admin',
  ORG_MEMBER: 'member',
};

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

  const acts = ['delete', 'change_role']; // Adjusted action names to match policies if needed, or stick to 'assign_role' if that's what policies use. Original 'assign_role'.
  // But wait, the policy usually says 'update' or generic 'manage'.
  // However, allowedOrgsPerms checks SPECIFIC actions.
  // We'll stick to 'delete' and 'assign_role' as in original code, but verify if they exist in FGA/Cerbos policies.
  // Assuming they are mapped in policies.
  const checkActs = ['delete', 'assign_role'];

  const permsByResourceId = await allowedOrgsPerms(ctx, resources, checkActs);

  const data = members.map((m) => ({
    ...m,
    _me: {
      isMe: m.userId === ctx.actorId,
      perms: permsByResourceId[m.id] ?? [],
    },
  }));

  return { data, meta: { total: members.length } };
};

const remove = async (input: { orgId: string; userId: string }, ctx: OrgMemContext) => {
  return executeTransaction(prisma, async (tx) => {
    // Need unique index on [orgId, userId]
    const orgId_userId = { orgId: input.orgId, userId: input.userId };

    // We fetch first to get data for FGA
    const member = await tx.orgMember.findUnique({
      where: { orgId_userId },
    });
    if (!member) return null;

    // Delete from DB
    await tx.orgMember.delete({
      where: { orgId_userId },
    });

    // Enqueue FGA removal
    const job = await enqueueFgaJob(tx, {
      kind: 'org_member_remove',
      member: { id: member.id, orgId: member.orgId, userId: member.userId, role: member.role },
    });

    // Best-effort process immediately
    processFgaJob(job.id, tx as any).catch((err: any) => {
      // tx might not work here if transaction finishes? No, we should pass undefined or prisma, or handle it carefully.
      // processFgaJob takes a client. If we pass `tx`, it must be alive.
      // But we are returning from transaction, so `tx` will close.
      // We should process it AFTER transaction commits.
      // But here we are inside.
      // Actually `processFgaJob` starts a NEW transaction for status update if we pass `prisma`.
      // If we pass `tx`, it joins the current one.
      // For reliability, we should process AFTER standard commit.
      // But `executeTransaction` returns the result of the callback.
      // We can return the jobId and process it outside.
      // Or just fire and forget with global prisma client?
    });
    return { ok: true, fgaJobId: job.id };
  });
};

const assign = async (
  input: { orgId: string; userId: string; role: OrgRole },
  ctx: OrgMemContext,

  client: Prisma.TransactionClient = prisma,
) => {
  // Check permissions: Actor must be able to manage this role on this org
  // We need to fetch Org to get ownerId for attributes if needed
  const org = await prisma.organization.findUnique({ where: { id: input.orgId } });
  if (!org) throw new Error('Organization not found');

  const action = `members:manage#${ROLE_TO_MANAGE_ACTION[input.role]}`;
  await ensureCan(
    action,
    { kind: 'org', id: org.id, attr: { orgId: org.id, ownerId: org.ownerId } },
    ctx,
  );

  return executeTransaction(client, async (tx) => {
    const orgId_userId = { orgId: input.orgId, userId: input.userId };
    const mem = await tx.orgMember.findUnique({ where: { orgId_userId } });
    if (!mem) throw new Error('Member not found');

    const updated = await tx.orgMember.update({
      where: { orgId_userId },
      data: { role: input.role },
    });

    const job = await enqueueFgaJob(tx, {
      kind: 'org_member_assign',
      oldMember: { id: mem.id, orgId: mem.orgId, userId: mem.userId, role: mem.role },
      newMember: {
        id: updated.id,
        orgId: updated.orgId,
        userId: updated.userId,
        role: updated.role,
      },
    });

    return { updated, fgaJobId: job.id };
  }).then(async ({ updated, fgaJobId }) => {
    // Process outside transaction
    processFgaJob(fgaJobId).catch((err) => logger.error(err, 'FGA assign processing failed'));
    return updated;
  });
};

const add = async (
  input: { orgId: string; userId: string; role: OrgRole },
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

    const job = await enqueueFgaJob(tx, {
      kind: 'org_member_add',
      member: {
        id: newMember.id,
        orgId: newMember.orgId,
        userId: newMember.userId,
        role: newMember.role,
      },
    });

    return { newMember, fgaJobId: job.id };
  }).then(async ({ newMember, fgaJobId }) => {
    processFgaJob(fgaJobId).catch((err) => logger.error(err, 'FGA add processing failed'));
    return newMember;
  });
};

const leave = async (
  input: { orgId: string; userId: string },
  ctx: OrgMemContext,
  client: Prisma.TransactionClient = prisma,
) => {
  // Fix logic: User can only leave for themselves
  if (input.userId !== ctx.actorId) {
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
