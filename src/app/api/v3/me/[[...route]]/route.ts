import { authenticatedHono, getAuthFromRequestHono } from '@/lib/authn';
import { prisma } from '@/lib/prisma';
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { NextResponse } from 'next/server';
import { ZOrgInviteItem } from '@/contracts/organizations/organization.query';

const meHono = new Hono().basePath('/api/v3/me');
meHono.use(authenticatedHono);

meHono.get('/invites', async (c) => {
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

export const GET = handle(meHono);
export const POST = handle(meHono);
export const PUT = handle(meHono);
export const PATCH = handle(meHono);
export const DELETE = handle(meHono);
