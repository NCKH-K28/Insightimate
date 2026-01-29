import { prisma } from '@/lib/prisma';
import { inviteToken } from './invite-token';
import { genOrgInviteId } from '../utils/id';
import { transporter } from '@/lib/mail-sender';
import serverConfig from '@/configs/server';
import { ensureCan, ensureCanMany } from '../utils/authz';
import uniqBy from 'lodash/uniqBy';

const sendOrgInvitation = async (p: {
  token: string;
  email: string;
  expiresAt: Date;
  organization: { id: string; name: string };
  inviter: { name: string; email: string };
}) => {
  const appURL = serverConfig.appURL;
  const inviteLink = `${appURL}/orgs/${p.organization.id}/invite?token=${encodeURIComponent(p.token)}`;
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

const EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const ensueCanInvite = async (
  input: OrgInviteCreateInput & { ownerId: string },
  ctx: { actorId: string },
) => {
  const ROLE_MAP = { ORG_OWNER: 'owner', ORG_ADMIN: 'admin', ORG_MEMBER: 'member' };
  await ensureCan(
    `members:manage#${ROLE_MAP[input.role]}`,
    { id: input.orgId, kind: 'org', attr: { orgId: input.orgId } },
    ctx,
  );
};

type OrgInviteCreateInput = { orgId: string; email: string; role: 'ORG_MEMBER' | 'ORG_ADMIN' };
const createInvite = async (input: OrgInviteCreateInput, ctx: { actorId: string }) => {
  const orgId = input.orgId;
  const invitedBy = ctx.actorId;
  const role = input.role;
  const email = input.email.toLowerCase().trim();

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new Error('ORG_NOT_FOUND');

  await ensueCanInvite({ ...input, ownerId: org.ownerId }, ctx);

  const expiresAt = new Date(Date.now() + EXPIRATION_MS);
  const exp = Math.floor(expiresAt.getTime() / 1000);
  const token = await inviteToken.generate({ sub: orgId, email, exp });

  const result = await prisma.$transaction(async (tx) => {
    const exists = await tx.orgInvitation.findUnique({
      where: { orgId_email: { orgId, email } },
      include: { inviter: true, organization: true },
    });

    if (!exists) {
      const id = genOrgInviteId();
      const invite = await tx.orgInvitation.create({
        data: { id, orgId, email, role, token, expiresAt, invitedBy },
        include: { inviter: true, organization: true },
      });
      return { invite, action: 'SEND', reson: 'CREATED' };
    }

    if (exists.status === 'PENDING' && exists.expiresAt > new Date()) {
      return { invite: exists, action: 'SKIP', reson: 'EXISTS_PENDING' };
    }
    if (exists.status === 'ACCEPTED') throw new Error('INVITE_ALREADY_ACCEPTED');
    const invite = await tx.orgInvitation.update({
      where: { orgId_email: { orgId, email } },
      data: { token, expiresAt, role, status: 'PENDING', invitedBy },
      include: { inviter: true, organization: true },
    });

    return { invite, action: 'SEND', reason: 'REFRESHED' };
  });
  if (result.action === 'SKIP') return result.invite;
  if (result.action === 'SEND') {
    await sendOrgInvitation(result.invite).catch((err) => {
      console.error('Failed to send org invitation email:', err);
    });
  }

  return result;
};

const bulkCreateInvites = async (
  input: {
    orgId: string;
    invites: Array<{ email: string; role: 'ORG_MEMBER' | 'ORG_ADMIN' }>;
  },
  ctx: { actorId: string },
) => {
  const { orgId } = input;

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new Error('ORG_NOT_FOUND');
  const invites = uniqBy(
    input.invites.map((i) => ({ email: i.email.toLowerCase().trim(), role: i.role })),
    (i) => i.email,
  );

  // check permissions once for all invites
  const uniqueRoles = Array.from(new Set(invites.map((inv) => inv.role)));
  const acts = uniqueRoles.map((role) => {
    const ROLE_MAP = { ORG_OWNER: 'owner', ORG_ADMIN: 'admin', ORG_MEMBER: 'member' };
    return `members:manage#${ROLE_MAP[role]}`;
  });
  await ensureCanMany(acts, { id: orgId, kind: 'org', attr: { orgId, ownerId: org.ownerId } }, ctx);
  // ========

  const expiresAt = new Date(Date.now() + EXPIRATION_MS);
  const exp = Math.floor(expiresAt.getTime() / 1000);
  const toInvites = await Promise.all(
    invites.map(async (inv) => {
      const token = await inviteToken.generate({ sub: orgId, email: inv.email, exp });
      return { ...inv, token };
    }),
  );

  await prisma.$transaction(async (tx) => {
    const existingInvites = await tx.orgInvitation.findMany({
      where: { orgId, email: { in: toInvites.map((i) => i.email) } },
    });
    // some exits throw
    if (existingInvites.length > 0) {
      const msg = existingInvites
        .map((inv) =>
          inv.status === 'ACCEPTED'
            ? `Invitation for ${inv.email} has already been accepted.`
            : `Pending invitation for ${inv.email} already exists.`,
        )
        .join(' ');
      throw new Error(msg);
    }
  });

  // all done

  return true;
};

export const orgInvitationService = {
  create: createInvite,
  bulkCreate: bulkCreateInvites,
};
