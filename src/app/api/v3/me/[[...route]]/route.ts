import { authenticatedHono, getAuthFromRequestHono } from '@/lib/authn';
import { prisma } from '@/lib/prisma';
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { NextResponse } from 'next/server';
import { ZOrgInviteItem } from '@/contracts/organization/organization.query';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { orgInvitationService } from '@/features/organization/server/org-invitation.service';
import { inviteToken } from '@/features/organization/server/invite-token';

const ZOrgInviteAcceptInput = z.object({ token: z.string().min(1, 'Token is required') });
const ZOrgInviteRejectInput = z.object({ token: z.string().min(1, 'Token is required') });

const meHono = new Hono().basePath('/api/v3/me');
meHono.use(authenticatedHono);

meHono.get('/orgs/invitees', async (c) => {
  const auth = await getAuthFromRequestHono(c);

  const now = new Date();
  const where = { email: auth.email, expiresAt: { gt: now } };
  const invitations = await prisma.orgInvitation.findMany({
    where,
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      expiresAt: true,
      organization: { select: { id: true, name: true, logo: true } },
      inviter: { select: { id: true, name: true, email: true, avatar: true } },
    },
  });

  const total = await prisma.orgInvitation.count({ where });
  const data = ZOrgInviteItem.array().parse(invitations);
  const result = { data, meta: { total } };

  return NextResponse.json(result);
});

meHono.get('/orgs/invitees/:orgId', zValidator('json', ZOrgInviteAcceptInput), async (c) => {
  throw new Error('Not implemented');
  // const auth = await getAuthFromRequestHono(c);
  // const { orgId } = c.req.param();
  // const { token } = c.req.valid('json');
  // const payload = await inviteToken.verify(token);
  // if (payload.email !== auth.email) {
  //   return NextResponse.json({ error: 'Invalid invitation token' }, { status: 400 });
  // }
});

meHono.post('/orgs/invitees/accept', zValidator('json', ZOrgInviteAcceptInput), async (c) => {
  const auth = await getAuthFromRequestHono(c);
  const { token } = c.req.valid('json');
  const payload = await inviteToken.verify(token);
  if (payload.email !== auth.email) {
    return NextResponse.json({ error: 'Invalid invitation token' }, { status: 400 });
  }
  const data = await orgInvitationService.accept({ token }, { actorId: auth.id });
  return NextResponse.json({ data });
});

meHono.post('/orgs/invitees/reject', zValidator('json', ZOrgInviteRejectInput), async (c) => {
  const auth = await getAuthFromRequestHono(c);
  const { token } = c.req.valid('json');
  const payload = await inviteToken.verify(token);
  if (payload.email !== auth.email) {
    return NextResponse.json({ error: 'Invalid invitation token' }, { status: 400 });
  }

  const data = await orgInvitationService.reject({ token }, { actorId: auth.id });
  return NextResponse.json({ data });
});

// == New endpoints for invite page ==
// GET /api/v3/me/orgs/invite?token=xxx - Preview invitation
meHono.get('/orgs/invite', zValidator('query', z.object({ token: z.string() })), async (c) => {
  const auth = await getAuthFromRequestHono(c);
  const { token } = c.req.valid('query');

  try {
    const payload = await inviteToken.verify(token);
    const invitation = await orgInvitationService.preview({ token }, { actorId: auth.userId });

    return c.json({
      organization: {
        id: invitation.organization.id,
        name: invitation.organization.name,
        logoURL: invitation.organization.logo,
      },
      invitation: {
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt.toISOString(),
      },
      inviter: {
        id: invitation.inviter.id,
        name: invitation.inviter.name,
        email: invitation.inviter.email,
      },
    });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch invite info' },
      400,
    );
  }
});

// POST /api/v3/me/orgs/:orgId/invite/accept?token=xxx
meHono.post(
  '/orgs/:orgId/invite/accept',
  zValidator('query', z.object({ token: z.string() })),
  async (c) => {
    const auth = await getAuthFromRequestHono(c);
    const { token } = c.req.valid('query');
    const { orgId } = c.req.param();

    try {
      const payload = await inviteToken.verify(token);
      if (payload.sub !== orgId) {
        return c.json({ error: 'Token does not match organization' }, 400);
      }

      const result = await orgInvitationService.accept({ token }, { actorId: auth.userId });
      return c.json(result);
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : 'Failed to accept invite' },
        400,
      );
    }
  },
);

// POST /api/v3/me/orgs/:orgId/invite/reject?token=xxx
meHono.post(
  '/orgs/:orgId/invite/reject',
  zValidator('query', z.object({ token: z.string() })),
  async (c) => {
    const auth = await getAuthFromRequestHono(c);
    const { token } = c.req.valid('query');
    const { orgId } = c.req.param();

    try {
      const payload = await inviteToken.verify(token);
      if (payload.sub !== orgId) {
        return c.json({ error: 'Token does not match organization' }, 400);
      }

      await orgInvitationService.reject({ token }, { actorId: auth.userId });
      return c.json({ ok: true });
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : 'Failed to reject invite' },
        400,
      );
    }
  },
);

export const GET = handle(meHono);
export const POST = handle(meHono);
export const PUT = handle(meHono);
export const PATCH = handle(meHono);
export const DELETE = handle(meHono);
