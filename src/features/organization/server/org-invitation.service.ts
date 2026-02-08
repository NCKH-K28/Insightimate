import { prisma } from '@/lib/prisma';
import { inviteToken } from './invite-token';
import { genOrgInviteId } from '../utils/id';
import { transporter } from '@/lib/mail-sender';
import serverConfig from '@/configs/server';
import { ensureCan, ensureCanMany } from '../utils/authz';
import { OrgError } from '@/lib/http/errors';
import { OrgRole } from '@/contracts/organizations/organization';
import { OrgInvitationItem } from '@/contracts/organizations/organization.query';
import { orgMemberService } from './org-member.service';
import { OrgInvitation } from '@prisma/client';

const INVITE_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const ROLE_TO_MANAGE_ACTION: Record<OrgRole, string> = {
  ORG_OWNER: 'owner',
  ORG_ADMIN: 'admin',
  ORG_MEMBER: 'member',
};

const normalizeEmail = (email: string) => email.toLowerCase().trim();

const buildExpiry = () => {
  const expiresAt = new Date(Date.now() + INVITE_EXPIRES_IN_MS);
  const exp = Math.floor(expiresAt.getTime() / 1000);
  return { expiresAt, exp };
};

const buildInviteLink = (orgId: string, token: string) =>
  `${serverConfig.appURL}/invite?token=${encodeURIComponent(token)}`;

type MailPayload = {
  token: string;
  email: string;
  expiresAt: Date;
  organization: { id: string; name: string };
  inviter: { name: string; email: string };
};

const sendOrgInvitation = async (p: MailPayload) => {
  const inviteLink = buildInviteLink(p.organization.id, p.token);

  await transporter.sendMail({
    from: `Insightimate <no-reply@insightimate.com>`,
    replyTo: `"${p.inviter.name}" <${p.inviter.email}>`,
    to: p.email,
    subject: `You're invited to join ${p.organization.name} on Insightimate`,
    text: `You are invited to join "${p.organization.name}". Accept: ${inviteLink}. Expires: ${p.expiresAt.toUTCString()}`,
    html: `
      <p>You have been invited to join <b>${p.organization.name}</b>.</p>
      <p><a href="${inviteLink}">Accept invitation</a></p>
      <p>This invitation expires on ${p.expiresAt.toUTCString()}.</p>
    `,
  });
};

const sendOrgInvitationSafe = async (p: MailPayload) => {
  try {
    await sendOrgInvitation(p);
  } catch (err) {
    console.error('Failed to send org invitation email:', err);
  }
};

const getOrgOrThrow = async (orgId: string) => {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new OrgError('ORG_NOT_FOUND', 'Organization not found');
  return org;
};

const getInviterOrThrow = async (actorId: string) => {
  const inviter = await prisma.user.findUnique({ where: { id: actorId } });
  if (!inviter) throw new OrgError('ORG_INVITER_NOT_FOUND', 'Inviter not found');
  return inviter;
};

const getInviteOrThrow = async (orgId: string, email: string) => {
  const invitation = await prisma.orgInvitation.findUnique({
    where: { orgId_email: { orgId, email } },
  });
  if (!invitation) throw new OrgError('ORG_INVITE_NOT_FOUND', 'Invitation not found');
  return invitation;
};

const ensureCanInviteRole = async (
  role: OrgRole,
  org: { id: string; ownerId: string },
  ctx: { actorId: string },
) => {
  const action = `members:manage#${ROLE_TO_MANAGE_ACTION[role]}`;
  await ensureCan(
    action,
    { id: org.id, kind: 'org', attr: { orgId: org.id, ownerId: org.ownerId } },
    ctx,
  );
};

type InviteResult = {
  invitation: OrgInvitation;
  outcome: 'SENT' | 'SKIPPED';
  reason: 'CREATED' | 'REFRESHED' | 'EXISTS_VALID';
};

type OrgInviteCreateInput = { orgId: string; email: string; role: OrgRole };

const invite = async (
  input: OrgInviteCreateInput,
  ctx: { actorId: string },
): Promise<InviteResult> => {
  const orgId = input.orgId;
  const role = input.role;
  const email = normalizeEmail(input.email);

  const [org, inviter] = await Promise.all([getOrgOrThrow(orgId), getInviterOrThrow(ctx.actorId)]);
  await ensureCanInviteRole(role, org, ctx);

  const { expiresAt, exp } = buildExpiry();
  const token = await inviteToken.generate({ sub: orgId, email, exp });
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.orgInvitation.findUnique({
      where: { orgId_email: { orgId, email } },
    });

    if (!existing) {
      const invitation = await tx.orgInvitation.create({
        data: {
          id: genOrgInviteId(),
          orgId,
          email,
          role,
          token,
          expiresAt,
          invitedBy: ctx.actorId,
          status: 'PENDING',
        },
      });
      return { invitation, outcome: 'SENT' as const, reason: 'CREATED' as const };
    }

    if (existing.status === 'ACCEPTED') {
      throw new OrgError('ORG_INVITE_ALREADY_ACCEPTED', 'Invitation already accepted');
    }

    const stillValid = existing.status === 'PENDING' && existing.expiresAt > now;
    if (stillValid) {
      return { invitation: existing, outcome: 'SKIPPED' as const, reason: 'EXISTS_VALID' as const };
    }

    const invitation = await tx.orgInvitation.update({
      where: { orgId_email: { orgId, email } },
      data: { token, expiresAt, role, status: 'PENDING', invitedBy: ctx.actorId },
    });

    return { invitation, outcome: 'SENT' as const, reason: 'REFRESHED' as const };
  });

  if (result.outcome === 'SENT') {
    await sendOrgInvitationSafe({
      token,
      email,
      expiresAt,
      organization: { id: org.id, name: org.name },
      inviter: { name: inviter.name, email: inviter.email },
    });
  }

  return result;
};

type BulkInviteInput = {
  orgId: string;
  invitees: Array<{ email: string; role: OrgRole }>;
};

type BulkInviteItemResult =
  | { email: string; role: OrgRole; outcome: 'SENT'; reason: 'CREATED' | 'REFRESHED' }
  | { email: string; role: OrgRole; outcome: 'SKIPPED'; reason: 'EXISTS_VALID' }
  | { email: string; role: OrgRole; outcome: 'ERROR'; reason: 'ALREADY_ACCEPTED' };

type BulkInviteResult = {
  orgId: string;
  results: BulkInviteItemResult[];
};

const bulkInvite = async (
  input: BulkInviteInput,
  ctx: { actorId: string },
): Promise<BulkInviteResult> => {
  const orgId = input.orgId;
  const org = await getOrgOrThrow(orgId);

  // normalize + dedupe by email (last wins)
  const byEmail = new Map<string, { email: string; role: OrgRole }>();
  for (const inv of input.invitees) {
    const email = normalizeEmail(inv.email);
    byEmail.set(email, { email, role: inv.role });
  }
  const invitees = Array.from(byEmail.values());

  // check permissions once (unique roles)
  const uniqueRoles = Array.from(new Set(invitees.map((i) => i.role)));
  const actions = uniqueRoles.map((r) => `members:manage#${ROLE_TO_MANAGE_ACTION[r]}`);
  await ensureCanMany(
    actions,
    { id: orgId, kind: 'org', attr: { orgId, ownerId: org.ownerId } },
    ctx,
  );

  const inviter = await getInviterOrThrow(ctx.actorId);

  const { expiresAt, exp } = buildExpiry();
  const now = new Date();

  // pre-generate tokens outside tx
  const tokenByEmail = new Map<string, string>();
  await Promise.all(
    invitees.map(async ({ email }) => {
      const token = await inviteToken.generate({ sub: orgId, email, exp });
      tokenByEmail.set(email, token);
    }),
  );

  const results: BulkInviteItemResult[] = [];

  await prisma.$transaction(async (tx) => {
    const existing = await tx.orgInvitation.findMany({
      where: { orgId, email: { in: invitees.map((i) => i.email) } },
      select: { email: true, status: true, expiresAt: true },
    });
    const existingByEmail = new Map(existing.map((e) => [e.email, e]));

    const writes: Array<Promise<unknown>> = [];

    for (const inv of invitees) {
      const prev = existingByEmail.get(inv.email);
      const token = tokenByEmail.get(inv.email)!;

      if (!prev) {
        writes.push(
          tx.orgInvitation.create({
            data: {
              id: genOrgInviteId(),
              orgId,
              email: inv.email,
              role: inv.role,
              token,
              expiresAt,
              invitedBy: ctx.actorId,
              status: 'PENDING',
            },
          }),
        );
        results.push({ email: inv.email, role: inv.role, outcome: 'SENT', reason: 'CREATED' });
        continue;
      }

      if (prev.status === 'ACCEPTED') {
        results.push({
          email: inv.email,
          role: inv.role,
          outcome: 'ERROR',
          reason: 'ALREADY_ACCEPTED',
        });
        continue;
      }

      const stillValid = prev.status === 'PENDING' && prev.expiresAt > now;
      if (stillValid) {
        results.push({
          email: inv.email,
          role: inv.role,
          outcome: 'SKIPPED',
          reason: 'EXISTS_VALID',
        });
        continue;
      }

      writes.push(
        tx.orgInvitation.update({
          where: { orgId_email: { orgId, email: inv.email } },
          data: { token, expiresAt, role: inv.role, status: 'PENDING', invitedBy: ctx.actorId },
        }),
      );
      results.push({ email: inv.email, role: inv.role, outcome: 'SENT', reason: 'REFRESHED' });
    }

    await Promise.all(writes);
  });

  // send mails for SENT only (best-effort)
  await Promise.all(
    results
      .filter((r): r is Extract<BulkInviteItemResult, { outcome: 'SENT' }> => r.outcome === 'SENT')
      .map((r) =>
        sendOrgInvitationSafe({
          token: tokenByEmail.get(r.email)!,
          email: r.email,
          expiresAt,
          organization: { id: org.id, name: org.name },
          inviter: { name: inviter.name, email: inviter.email },
        }),
      ),
  );

  return { orgId, results };
};

const preview = async (input: { token: string }, ctx: { actorId: string }) => {
  const payload = await inviteToken.verify(input.token);
  const orgId = payload.sub;
  const email = payload.email;
  const invitation = await prisma.orgInvitation.findUnique({
    where: { orgId_email: { orgId, email } },
    include: { organization: true, inviter: true },
  });
  if (!invitation) throw new OrgError('ORG_INVITE_NOT_FOUND', 'Invitation not found');
  return invitation;
};

const revoke = async (input: { orgId: string; email: string }, ctx: { actorId: string }) => {
  const orgId = input.orgId;
  const email = normalizeEmail(input.email);
  const org = await getOrgOrThrow(orgId);
  await ensureCanInviteRole('ORG_MEMBER', org, ctx);
  await prisma.orgInvitation.updateMany({
    where: { orgId, email, status: 'PENDING' },
    data: { status: 'REVOKED' },
  });
};

const resend = async (input: { orgId: string; email: string }, ctx: { actorId: string }) => {
  const orgId = input.orgId;
  const email = normalizeEmail(input.email);
  const org = await getOrgOrThrow(orgId);
  let invitee = await getInviteOrThrow(orgId, email);
  await ensureCanInviteRole(invitee.role, org, ctx);

  // Check if expired, if so, refresh it
  if (invitee.expiresAt < new Date()) {
    const { expiresAt, exp } = buildExpiry();
    const token = await inviteToken.generate({ sub: orgId, email, exp });

    // Update DB with new token
    invitee = await prisma.orgInvitation.update({
      where: { orgId_email: { orgId, email } },
      data: { token, expiresAt, status: 'PENDING' },
    });
  }

  const inviter = await getInviterOrThrow(ctx.actorId);
  await sendOrgInvitationSafe({
    token: invitee.token,
    email,
    expiresAt: invitee.expiresAt,
    organization: { id: org.id, name: org.name },
    inviter: { name: inviter.name, email: inviter.email },
  });
};

const accept = async (input: { token: string }, ctx: { actorId: string }) => {
  const payload = await inviteToken.verify(input.token);
  const orgId = payload.sub;
  const email = payload.email;

  const invitation = await prisma.orgInvitation.findUnique({
    where: { orgId_email: { orgId, email } },
  });
  if (!invitation) throw new OrgError('ORG_INVITE_NOT_FOUND', 'Invitation not found');
  if (invitation.status === 'ACCEPTED')
    throw new OrgError('ORG_INVITE_ALREADY_ACCEPTED', 'Invitation already accepted');
  if (invitation.expiresAt < new Date())
    throw new OrgError('ORG_INVITE_EXPIRED', 'Invitation has expired');
  if (invitation.token !== input.token)
    throw new OrgError('ORG_INVALID_INVITE_TOKEN', 'Invalid invitation token');

  // Transaction: Mark accepted and add member
  await prisma.$transaction(async (tx) => {
    await tx.orgInvitation.update({
      where: { orgId_email: { orgId, email } },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    });

    await orgMemberService.add(
      {
        orgId,
        userId: ctx.actorId,
        role: invitation.role,
      },
      ctx,
      tx,
    );
  });

  return { ok: true, orgId };
};

const reject = async (input: { token: string }, ctx: { actorId: string }) => {
  const payload = await inviteToken.verify(input.token);
  const orgId = payload.sub;
  const email = payload.email;

  const invitation = await prisma.orgInvitation.findUnique({
    where: { orgId_email: { orgId, email } },
  });
  if (!invitation) throw new OrgError('ORG_INVITE_NOT_FOUND', 'Invitation not found');
  if (invitation.status === 'ACCEPTED')
    throw new OrgError('ORG_INVITE_ALREADY_ACCEPTED', 'Invitation already accepted');
  if (invitation.expiresAt < new Date())
    throw new OrgError('ORG_INVITE_EXPIRED', 'Invitation has expired');
  if (invitation.token !== input.token)
    throw new OrgError('ORG_INVALID_INVITE_TOKEN', 'Invalid invitation token');

  await prisma.orgInvitation.updateMany({
    where: { orgId, email, status: 'PENDING' },
    data: { status: 'REJECTED' },
  });
};

const list = async (input: { orgId: string }, ctx: { actorId: string }) => {
  const org = await getOrgOrThrow(input.orgId);
  // Check permission to read members/invites
  await ensureCan(
    `members:read`,
    { id: org.id, kind: 'org', attr: { orgId: org.id, ownerId: org.ownerId } },
    ctx,
  );

  return prisma.orgInvitation.findMany({
    where: { orgId: input.orgId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });
};

const listMy = async (input: { email: string }) => {
  return prisma.orgInvitation.findMany({
    where: { email: normalizeEmail(input.email), status: 'PENDING' },
    include: { organization: true, inviter: true },
    orderBy: { createdAt: 'desc' },
  });
};

export const orgInvitationService = {
  invite,
  bulkInvite,
  accept,
  reject,
  revoke,
  resend,
  preview,
  list,
  listMy,
};
