// src/features/authz/server/invite.service.ts
import { Prisma } from '@prisma/client';
import { executeTransaction, prisma } from '@/lib/prisma';
import { z } from 'zod';
import { EmailService } from '@/lib/mail-sender';
import { createId } from '@paralleldrive/cuid2';
import { inviteToken, InviteTokenPayload } from './invite-token';
import { InviteNotFoundError } from '@/lib/http/errors';
import { openfgaClient } from '@/lib/authz/openfga';
import { buildWorkspaceMemberTuples } from '../api/tuple-factory';

// === Configuration ===
const CONFIG = {
  INVITE_EXPIRY_DAYS: 7,
  TOKEN_ALGORITHM: 'HS256' as const,
  SEARCH_LIMIT: 5,
  SECRET: new TextEncoder().encode(process.env.AUTH_JWT_SECRET ?? 'dev-secret'),
} as const;

// === Utilities ===
const generateInviteId = () => `inv_${createId()}`;
const generateMemberId = () => `mem_${createId()}`;

const calculateExpirationDate = (days: number = CONFIG.INVITE_EXPIRY_DAYS): Date =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000);

export interface ListInvitesQuery {
  resourceType: 'WORKSPACE';
  resourceId: string;
}

export interface InviteContext {
  actorId: string;
}

export interface Resource {
  type: 'WORKSPACE' | 'TEAM' | 'PROJECT';
  id: string;
}

export const ZInviteUsersInput = z.object({
  resourceType: z.enum(['WORKSPACE', 'TEAM', 'PROJECT']),
  resourceId: z.string().min(1),
  invitees: z.array(z.string().email()),
  roleId: z.enum(['WS_ADMIN', 'WS_MEMBER']),
});
type InviteUsersInput = z.infer<typeof ZInviteUsersInput>;

export interface UserSearchResult {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  status: 'INVITED' | 'NONE';
}

export interface InviteInfo {
  resource: { id: string; name: string };
  inviter: { name: string | null; email: string; avatar: string | null };
  expiresAt: string;
}

export interface JoinInviteData {
  token: string;
  action: 'ACCEPT' | 'REJECT';
  userId?: string; // Required for accept action
}

const ZInvitePayload = z.object({
  roleId: z.string().min(1),
  resourceName: z.string().optional(),
  user: z.object({
    email: z.string().email(),
    name: z.string().optional(),
    avatar: z.string().optional(),
  }),
});

const listInvites = async (query: ListInvitesQuery, context: InviteContext) => {
  const invites = await prisma.invitation.findMany({
    where: {
      resourceType: query.resourceType,
      resourceId: query.resourceId,
      revokedAt: null,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  return {
    data: invites
      .map((inv) => ({ ...inv, user: { email: inv.email } }))
      .map((inv) => ({
        id: inv.id,
        user: { email: inv.email },
        status: inv.revokedAt ? 'REVOKED' : inv.acceptedAt ? 'ACCEPTED' : 'PENDING',
        expiresAt: inv.expiresAt.toISOString(),
      })),
  };
};

const getInviteInfo = async (token: string): Promise<InviteInfo> => {
  const payload = await inviteToken.verify(token);
  const invite = await prisma.invitation.findUnique({
    where: {
      id: payload.sub,
      email: payload.email,
      revokedAt: null,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { inviter: { select: { name: true, email: true, avatar: true } } },
  });
  if (!invite) throw new InviteNotFoundError();

  const invitePayload = ZInvitePayload.parse(invite.payload);

  return {
    resource: { id: invite.resourceId, name: invitePayload.resourceName || 'Unknown' },
    inviter: {
      name: invite.inviter.name,
      email: invite.inviter.email,
      avatar: invite.inviter.avatar,
    },
    expiresAt: invite.expiresAt.toISOString(),
  };
};

const inviteUsers = async (input: InviteUsersInput, context: InviteContext) => {
  if (!input.invitees.length) throw new Error('At least one email is required');
  const expirationDate = calculateExpirationDate();

  const resource = await prisma.workspace.findUnique({
    where: { id: input.resourceId },
    select: { id: true, name: true },
  });
  if (!resource) throw new Error('Resource not found');

  const emailTokenPairs = await Promise.all(
    input.invitees.map(async (email) => {
      const payload: InviteTokenPayload = { sub: generateInviteId(), email };
      const token = await inviteToken.generate(payload);
      return { email, token, sub: payload.sub };
    }),
  );

  const invitations = await executeTransaction(prisma, async (tx) => {
    return Promise.all(
      emailTokenPairs.map(({ email, token, sub }) =>
        tx.invitation.upsert({
          where: {
            unique_active_invite: {
              email,
              resourceType: input.resourceType,
              resourceId: input.resourceId,
            },
          },
          create: {
            id: sub,
            email,
            token,
            expiresAt: expirationDate,
            resourceType: input.resourceType,
            resourceId: input.resourceId,
            invitedBy: context.actorId,
            payload: ZInvitePayload.parse({
              roleId: input.roleId,
              resourceName: resource.name,
              user: { email },
            }),
          },
          update: {
            id: sub,
            token,
            expiresAt: expirationDate,
            payload: ZInvitePayload.parse({
              roleId: input.roleId,
              resourceName: resource.name,
              user: { email },
            }),
            revokedAt: null,
            acceptedAt: null,
          },
        }),
      ),
    );
  });

  const emailResults = await Promise.allSettled(
    invitations.map((invitation) =>
      EmailService.sendInvitationEmail({
        email: invitation.email,
        token: invitation.token,
        resourceType: invitation.resourceType,
        expiresAt: invitation.expiresAt,
      }),
    ),
  );

  // Log failed email sends
  emailResults.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(
        `Failed to send invitation email to ${invitations[index].email}:`,
        result.reason,
      );
    }
  });
};

const searchCandidates = async (
  search: string,
  resource: Resource,
  limit: number = CONFIG.SEARCH_LIMIT,
) => {
  const trimmedSearch = search.trim();
  if (trimmedSearch.length === 0) return { data: [] };

  const textSearchCondition: Prisma.UserWhereInput = {
    OR: [
      { email: { contains: trimmedSearch, mode: 'insensitive' } },
      { name: { contains: trimmedSearch, mode: 'insensitive' } },
    ],
  };

  let whereCondition: Prisma.UserWhereInput = {};

  if (resource.type === 'WORKSPACE') {
    whereCondition = {
      AND: [textSearchCondition, { workspaceMembers: { none: { workspaceId: resource.id } } }],
    };
  } else if (resource.type === 'TEAM') {
    const team = await prisma.team.findUnique({ where: { id: resource.id } });
    if (!team) throw new Error('Team not found');

    whereCondition = {
      AND: [
        textSearchCondition,
        {
          teams: { none: { id: resource.id } },
          workspaceMembers: { some: { workspaceId: team.workspaceId } },
        },
      ],
    };
  } else if (resource.type === 'PROJECT') {
    const project = await prisma.project.findUnique({ where: { id: resource.id } });
    if (!project) throw new Error('Project not found');

    const projectActors = await prisma.projectActor.findMany({
      where: { projectId: project.id, actorType: 'USER' },
      select: { actorId: true },
    });
    const actorIds = projectActors.map((pa) => pa.actorId);

    whereCondition = {
      AND: [
        textSearchCondition,
        { id: { notIn: actorIds } },
        { workspaceMembers: { some: { workspaceId: project.workspaceId } } },
      ],
    };
  } else throw new Error('Invalid resource type');

  if (resource) {
    const users = await prisma.user.findMany({
      where: whereCondition,
      select: { id: true, name: true, email: true, avatar: true },
      take: limit,
    });

    return { data: users.map((user) => ({ ...user, status: 'NONE' as const })) };
  }

  throw new Error('Resource is required for searching candidates');
};

const revokeInvite = async (inviteId: string, context: InviteContext) => {
  const invite = await prisma.invitation.findUnique({ where: { id: inviteId } });
  if (!invite) throw new InviteNotFoundError();

  if (invite.revokedAt || invite.acceptedAt || invite.expiresAt < new Date()) {
    throw new Error('Cannot revoke an already used or expired invitation');
  }

  await prisma.invitation.update({
    where: { id: inviteId },
    data: { revokedAt: new Date() },
  });
};

const resendInvite = async (inviteId: string, context: InviteContext) => {
  const invite = await prisma.invitation.findUnique({ where: { id: inviteId } });
  if (!invite) throw new InviteNotFoundError();
  if (invite.revokedAt || invite.acceptedAt || invite.expiresAt < new Date()) {
    throw new Error('Cannot resend an already used or expired invitation');
  }

  try {
    await EmailService.sendInvitationEmail({
      email: invite.email,
      token: invite.token,
      resourceType: invite.resourceType,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error(`Failed to resend invitation email to ${invite.email}:`, error);
    throw new Error('Failed to resend invitation email');
  }
};

const processInvite = async (
  data: JoinInviteData,
): Promise<{ success: boolean; message?: string }> => {
  const tokenPayload = await inviteToken.verify(data.token);

  // Verify invitation exists and is valid
  const invite = await prisma.invitation.findUnique({
    where: {
      id: tokenPayload.sub,
      email: tokenPayload.email,
      revokedAt: null,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (!invite) throw new InviteNotFoundError();

  const payload = ZInvitePayload.parse(invite.payload);
  if (data.action === 'ACCEPT') {
    await executeTransaction(prisma, async (tx) => {
      if (payload.roleId !== 'WS_ADMIN' && payload.roleId !== 'WS_MEMBER') {
        throw new Error('Invalid role ID in invitation payload');
      }

      const user = await tx.user.findUnique({ where: { email: invite.email } });
      if (!user) throw new Error('User not found');

      const newMember = await tx.workspaceMember.create({
        data: {
          id: generateMemberId(),
          role: payload.roleId,
          userId: user.id,
          workspaceId: invite.resourceId,
        },
        include: { workspace: true },
      });

      // Mark invitation as accepted
      await tx.invitation.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });

      // call openFGA
      const tuples = buildWorkspaceMemberTuples(newMember);
      await openfgaClient.write({ writes: tuples });
    });

    return { success: true, message: 'Successfully joined the workspace' };
  } else if (data.action === 'REJECT') {
    await prisma.invitation.update({ where: { id: invite.id }, data: { revokedAt: new Date() } });
    return { success: true, message: 'Invitation declined' };
  } else {
    throw new Error('Invalid action. Must be "accept" or "reject"');
  }
};

export const inviteService = {
  listInvites,
  getInviteInfo,
  inviteUsers,
  searchCandidates,
  revokeInvite,
  resendInvite,
  processInvite,
};
