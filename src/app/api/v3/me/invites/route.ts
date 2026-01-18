import { ZOrgInviteItem } from '@/contracts/organizations/organization.query';
import { authenticatedHono, getAuthFromRequestHono } from '@/lib/auth/authn';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

import { appAPIV3 } from '@/lib/hono';
import { handle } from 'hono/vercel';

appAPIV3.get('/me/invites', authenticatedHono, async (c) => {
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

export const GET = handle(appAPIV3);
