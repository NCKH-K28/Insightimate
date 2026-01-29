import { authenticatedHono, getAuthFromRequestHono } from '@/lib/authn';
import { prisma } from '@/lib/prisma';
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { NextResponse } from 'next/server';
import { ZOrgInviteItem } from '@/contracts/organizations/organization.query';
import {
  acceptOrgInvitation,
  rejectOrgInvitation,
} from '@/features/organization/server/org-member.service';
import z from 'zod';
import { zValidator } from '@hono/zod-validator';
import { inviteToken } from '@/features/authz/server/invite-token';

export const ZOrgInviteAcceptInput = z.object({ token: z.string().min(1, 'Token is required') });
export const ZOrgInviteRejectInput = z.object({ token: z.string().min(1, 'Token is required') });

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
  const data = await acceptOrgInvitation({ token }, { actorId: auth.id });
  return NextResponse.json({ data });
});

meHono.post('/orgs/invitees/reject', zValidator('json', ZOrgInviteRejectInput), async (c) => {
  const auth = await getAuthFromRequestHono(c);
  const { token } = c.req.valid('json');
  const payload = await inviteToken.verify(token);
  if (payload.email !== auth.email) {
    return NextResponse.json({ error: 'Invalid invitation token' }, { status: 400 });
  }

  const data = await rejectOrgInvitation({ token }, { actorId: auth.id });
  return NextResponse.json({ data });
});

export const GET = handle(meHono);
export const POST = handle(meHono);
export const PUT = handle(meHono);
export const PATCH = handle(meHono);
export const DELETE = handle(meHono);
