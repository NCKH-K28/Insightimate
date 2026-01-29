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

meHono.get('/orgs/:orgId/invite', async (c) => {
  const orgId = c.req.param('orgId');
  const token = c.req.query('token');
  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  const invitation = await prisma.orgInvitation.findUnique({
    where: { orgId, token },
    include: { organization: true, inviter: true },
  });
  if (!invitation) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  }

  // is expired
  const now = new Date();
  const expiresAt = invitation.expiresAt;
  if (expiresAt < now) {
    return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
  }

  return NextResponse.json({ data: ZOrgInviteItem.parse(invitation) });
});

meHono.post('/orgs/:orgId/invite/accept', async (c) => {
  const auth = await getAuthFromRequestHono(c);
  const orgId = c.req.param('orgId');
  const token = c.req.query('token');
  if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  const data = await acceptOrgInvitation({ token, orgId }, { actorId: auth.userId });
  return NextResponse.json({ data });
});

meHono.post('/orgs/:orgId/invite/reject', async (c) => {
  const auth = await getAuthFromRequestHono(c);
  const orgId = c.req.param('orgId');
  const token = c.req.query('token');
  if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  const data = await rejectOrgInvitation({ token, orgId }, { actorId: auth.userId });
  return NextResponse.json({ data });
});

export const GET = handle(meHono);
export const POST = handle(meHono);
export const PUT = handle(meHono);
export const PATCH = handle(meHono);
export const DELETE = handle(meHono);
