import { prisma } from '@/lib/prisma';
import { allowedOrgsPerms } from '../utils/authz';
import { OrgMemberInviteInput } from '@/contracts/organizations/organization.query';
import { transporter } from '@/lib/mail-sender';
import { Prisma } from '@prisma/client';
import serverConfig from '@/configs/server';
import { buildOrganizationMemberTuples } from '@/lib/authz/tuple-factory';
import { openfgaClient } from '@/lib/authz/clients';
import { randomUUID } from 'node:crypto';
import { inviteToken } from './invite-token';

type OrgMemContext = { actorId: string };

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const INVITE_TTL_DAYS = 7;

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const now = () => new Date();

const isPendingInvitation = (inv: {
  acceptedAt: Date | null;
  rejectedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
}) => !inv.acceptedAt && !inv.rejectedAt && !inv.revokedAt && inv.expiresAt > now();

const buildInviteLink = (orgId: string, token: string) => {
  const base = serverConfig.appURL.replace(/\/$/, '');
  return `${base}/o/${orgId}/invite?token=${encodeURIComponent(token)}`;
};

/** ===================== LIST ===================== **/
export const listOrgMems = async (input: { orgId: string }, ctx: OrgMemContext) => {
  const { orgId } = input;

  // TODO: (khuyến nghị) check quyền "list members" ở đây trước khi query lớn.
  // await assertCanListMembers(orgId, ctx.actorId)

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

/** ===================== INVITE ===================== **/
export const inviteMembers = async (input: OrgMemberInviteInput, ctx: OrgMemContext) => {
  const orgId = input.orgId;

  // 1) normalize + dedupe invites theo email
  // policy chọn role nếu trùng email: ưu tiên admin > member
  const roleRank: Record<'member' | 'admin', number> = { member: 1, admin: 2 };
  const byEmail = new Map<string, { email: string; role: 'member' | 'admin' }>();

  for (const inv of input.invites) {
    const email = normalizeEmail(inv.email);
    const prev = byEmail.get(email);
    if (!prev || roleRank[inv.role] > roleRank[prev.role]) {
      byEmail.set(email, { email, role: inv.role });
    }
  }

  const uniqueInvites = Array.from(byEmail.values());
  if (uniqueInvites.length === 0) return [];

  // 2) lọc email đã là member
  const existingMembers = await prisma.orgMember.findMany({
    where: { orgId, user: { email: { in: uniqueInvites.map((x) => x.email) } } },
    select: { user: { select: { email: true } } },
  });
  const existingEmailSet = new Set(existingMembers.map((x) => normalizeEmail(x.user.email)));

  const candidates = uniqueInvites.filter((x) => !existingEmailSet.has(x.email));
  if (candidates.length === 0) return [];

  // 3) tránh tạo trùng invitation pending (nếu đã có pending và chưa expired thì reuse)
  const pendingInvites = await prisma.orgInvitation.findMany({
    where: {
      orgId,
      email: { in: candidates.map((x) => x.email) },
      acceptedAt: null,
      rejectedAt: null,
      revokedAt: null,
      expiresAt: { gt: now() },
    },
  });
  const pendingByEmail = new Map(pendingInvites.map((x) => [normalizeEmail(x.email), x]));

  const toCreate = candidates.filter((x) => !pendingByEmail.has(x.email));
  const created = toCreate.length
    ? await prisma.orgInvitation.createManyAndReturn({
        data: toCreate.map(
          (inv): Prisma.OrgInvitationCreateManyInput => ({
            orgId,
            email: inv.email,
            role: inv.role,
            invitedBy: ctx.actorId,
            expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * MS_PER_DAY),
            token: randomUUID(),
          }),
        ),
      })
    : [];

  // Merge: pending + created (tuỳ policy bạn muốn gửi mail lại pending hay không)
  const all = [...pendingInvites, ...created];

  // 4) gửi mail: allSettled để không fail cả batch
  await sendOrgInvitationEmail(
    all.map((x) => ({ email: x.email, orgId: x.orgId, token: x.token })),
  );

  return all;
};

export const sendOrgInvitationEmail = async (
  invitations: { email: string; orgId: string; token: string }[],
) => {
  const mails = invitations.map((inv) => ({
    to: inv.email,
    subject: `You're invited to join organization`,
    html: `Click <a href="${buildInviteLink(inv.orgId, inv.token)}">here</a> to accept the invitation.`,
  }));

  const results = await Promise.allSettled(mails.map((m) => transporter.sendMail(m)));

  // log chi tiết cái nào fail (không throw để tránh “đã tạo invitation nhưng báo lỗi”)
  results.forEach((r, idx) => {
    if (r.status === 'rejected') {
      console.error('Failed to send invitation email', {
        to: mails[idx]?.to,
        error: r.reason,
      });
    }
  });

  return results;
};

/** ===================== REVOKE ===================== **/
export const revokeOrgInvitation = async (
  input: { orgId: string; invitationId: string },
  ctx: OrgMemContext,
) => {
  // TODO: check quyền revoke

  const invitation = await prisma.orgInvitation.findFirst({
    where: { id: input.invitationId, orgId: input.orgId },
  });
  if (!invitation) throw new Error('Invitation not found');
  if (invitation.acceptedAt) throw new Error('Cannot revoke an accepted invitation');
  if (invitation.rejectedAt) throw new Error('Cannot revoke a rejected invitation');
  if (invitation.revokedAt) throw new Error('Invitation already revoked');

  // (tuỳ policy) cho revoke cả expired hay không. Mình cho phép revoke cả expired để dọn data.
  const result = await prisma.orgInvitation.update({
    where: { id: invitation.id },
    data: { revokedAt: now() },
  });

  return result;
};

/** ===================== ACCEPT / REJECT ===================== **/
export const acceptOrgInvitation = async (input: { token: string }, ctx: OrgMemContext) => {};
export const rejectOrgInvitation = async (input: { token: string }, ctx: OrgMemContext) => {};

/** ===================== REMOVE / UPDATE ROLE (bản hợp lý) ===================== **/
export const removeMemberFromOrg = async (
  input: { orgId: string; userId: string },
  ctx: OrgMemContext,
) => {
  // TODO: check permission (ctx.actorId có quyền delete member này không)
  // gợi ý: dùng allowedOrgsPerms trên resource { kind:'org_member', id: memberId... }

  const member = await prisma.orgMember.findUnique({
    where: { orgId_userId: { orgId: input.orgId, userId: input.userId } }, // cần unique index
  });
  if (!member) return null;

  await prisma.orgMember.delete({
    where: { orgId_userId: { orgId: input.orgId, userId: input.userId } },
  });

  // Side-effect: xoá tuples (tuỳ client hỗ trợ)
  try {
    const tuples = buildOrganizationMemberTuples(member);
    // Nếu bạn có API deleteTuples => dùng nó.
    // await openfgaClient.deleteTuples(tuples);
    // Nếu không có deleteTuples, bạn cần implement “write delete” theo OpenFGA SDK bạn đang dùng.
  } catch (err) {
    console.error('OpenFGA tuple cleanup failed after removing member', err);
  }

  return { ok: true };
};

export const updateOrgMemberRole = async (
  input: { orgId: string; userId: string; role: 'ORG_MEMBER' | 'ORG_ADMIN' | 'ORG_OWNER' },
  ctx: OrgMemContext,
) => {
  // TODO: check permission assign_role

  const member = await prisma.orgMember.findUnique({
    where: { orgId_userId: { orgId: input.orgId, userId: input.userId } },
  });
  if (!member) throw new Error('Member not found');

  if (member.role === input.role) return member;

  const updated = await prisma.orgMember.update({
    where: { orgId_userId: { orgId: input.orgId, userId: input.userId } },
    data: { role: input.role },
  });

  // Side-effect: cập nhật tuples (thường là delete cũ + write mới)
  try {
    const tuples = buildOrganizationMemberTuples(updated);
    await openfgaClient.writeTuples(tuples);
  } catch (err) {
    console.error('OpenFGA writeTuples failed after updating role', err);
  }

  return updated;
};
