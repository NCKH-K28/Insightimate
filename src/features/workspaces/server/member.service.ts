/* eslint-disable @typescript-eslint/no-unused-vars */

import { Prisma } from '@prisma/client';
import { executeTransaction, prisma } from '@/lib/prisma';
import { init } from '@paralleldrive/cuid2';
import { buildWorkspaceMemberTuples } from '@/features/authz/api/tuple-factory';
import { openfgaClient } from '@/lib/authz/openfga';
import { inviteService } from '@/features/authz/server';
import sortBy from 'lodash/sortBy';
import { WORKSPACE_MEMBER_ACTIONS, ZWsMemberList } from '@/contracts/workspaces';
import { checkResourcesMapped } from '@/lib/authz/cerbos';
import { loadPrincipal, workspaceMemberResourceFactory } from '@/features/authz/server/pip';

const memberCuid = init({ length: 10 });
const genMemberId = () => `mbr_${memberCuid()}`;

type Role = 'WS_ADMIN' | 'WS_MEMBER';
export type MemberServiceContext = { actorId: string };
export type MemberCreateInput = { role: Role; workspaceId: string; userId: string };
export type MemberUpdateInput = { role: Role; memberId: string };
export type MemberRemoveInput = { memberId: string };
export type MemberQueryParams = {
  filter?: { workspaceId?: string };
  include?: { permissions?: boolean };
};

const getById = async (id: string, context: MemberServiceContext) => {
  return prisma.workspaceMember.findUnique({ where: { id } });
};
const listMembers = async (params: MemberQueryParams, context: MemberServiceContext) => {
  const where: Prisma.WorkspaceMemberWhereInput = params.filter?.workspaceId
    ? { workspaceId: params.filter.workspaceId }
    : {};

  const members = await prisma.workspaceMember.findMany({
    where,
    select: {
      id: true,
      role: true,
      userId: true,
      user: { select: { id: true, email: true, name: true, avatar: true } },
      workspace: { select: { id: true, name: true, ownerId: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const sortedMembers = sortBy(
    members,
    (m) => (m.user.id == context.actorId ? -1 : 1),
    (m) => (m.role === 'WS_ADMIN' ? -1 : 1),
  );

  // === With permissions
  if (!params.include?.permissions) return { data: ZWsMemberList.parse(sortedMembers) };
  const resources = sortedMembers.map(workspaceMemberResourceFactory);
  const principal = await loadPrincipal(context, {}, resources);
  const actions = Array.from(WORKSPACE_MEMBER_ACTIONS);

  const resourcesWithActions = resources.map((r) => ({ resource: r, actions }));
  const { results } = await checkResourcesMapped({ principal, resources: resourcesWithActions });

  const data = members.map((m) => ({ ...m, permissions: results[m.id]?._actions }));

  const parsed = ZWsMemberList.parse(data);
  return { data: parsed };
};
const createMember = async (input: MemberCreateInput) => {
  return executeTransaction(prisma, async (tx) => {
    const member = await tx.workspaceMember.create({
      data: { ...input, id: genMemberId() },
    });

    // TODO: move to queue/outbox pattern
    const tuples = buildWorkspaceMemberTuples(member);
    await openfgaClient.write({ writes: tuples });

    return member;
  });
};
const createMembers = async (
  input: { userIds: string[]; workspaceId: string; role: Role; status?: 'PENDING' | 'ACTIVE' },
  context: MemberServiceContext,
  client = prisma,
) => {
  return executeTransaction(client, async (tx) => {
    const members = await tx.workspaceMember.createMany({
      data: input.userIds.map((userId) => ({
        id: genMemberId(),
        userId,
        workspaceId: input.workspaceId,
        role: input.role,
        status: input.status || 'ACTIVE',
      })),
      skipDuplicates: true,
    });
    return members;
  });
};
const updateMember = async (input: MemberUpdateInput) => {
  return executeTransaction(prisma, async (tx) => {
    const member = await tx.workspaceMember.findUnique({ where: { id: input.memberId } });
    if (!member) throw new Error('Member not found');
    const updated = await tx.workspaceMember.update({
      where: { id: input.memberId },
      data: { role: input.role },
    });

    // TODO: move to queue/outbox pattern
    const deleteTuples = buildWorkspaceMemberTuples(member);
    const createTuples = buildWorkspaceMemberTuples(updated);
    await openfgaClient.write({ deletes: deleteTuples, writes: createTuples });

    return updated;
  });
};
const removeMember = async (input: MemberRemoveInput, context: MemberServiceContext) => {
  return executeTransaction(prisma, async (tx) => {
    const member = await tx.workspaceMember.findUnique({ where: { id: input.memberId } });
    if (!member) throw new Error('Member not found');
    const deleted = await tx.workspaceMember.delete({ where: { id: input.memberId } });

    // TODO: move to queue/outbox pattern
    const deleteTuples = buildWorkspaceMemberTuples(deleted);
    await openfgaClient.write({ deletes: deleteTuples });

    return deleted;
  });
};

const inviteMembers = async (
  input: { emails: string[]; workspaceId: string; role: Role },
  context: MemberServiceContext,
  client = prisma,
) => {
  return executeTransaction(
    client,
    async (tx) => {
      const { emails, workspaceId, role } = input;
      // Chuẩn hoá & khử trùng lặp
      const uniqueEmails = Array.from(new Set(emails.map((e) => e.trim().toLowerCase())));
      if (uniqueEmails.length === 0) throw new Error('No emails provided');

      // Lấy users theo email
      const users = await tx.user.findMany({
        where: { email: { in: uniqueEmails } },
        select: { id: true, email: true },
      });
      if (users.length !== uniqueEmails.length)
        throw new Error('Some emails do not belong to any user');

      // Lấy các member ACTIVE theo userId
      const activeMembs = await tx.workspaceMember.findMany({
        where: { workspaceId, userId: { in: users.map((u) => u.id) } },
        select: { userId: true },
      });
      const activeUserIds = new Set(activeMembs.map((m) => m.userId));

      // Chỉ mời những user chưa ACTIVE
      const toInviteUsers = users.filter((u) => !activeUserIds.has(u.id));
      console.log({ toInviteUsers });
      if (toInviteUsers.length === 0) return;

      await Promise.all(
        toInviteUsers.map(({ id: userId }) =>
          tx.workspaceMember.upsert({
            where: { workspaceId_userId: { workspaceId, userId } },
            create: { id: genMemberId(), workspaceId, userId, role },
            update: { role },
          }),
        ),
      );

      // Gửi invite
      await inviteService.inviteUsers(
        {
          invitees: toInviteUsers.map((u) => u.email),
          resourceType: 'WORKSPACE',
          resourceId: workspaceId,
          roleId: role,
        },
        context,
      );
    },
    { timeout: 10000 },
  );
};

export const memberService = {
  getById,
  listMembers,
  createMember,
  createMembers,
  updateMember,
  removeMember,
  inviteMembers,
};
