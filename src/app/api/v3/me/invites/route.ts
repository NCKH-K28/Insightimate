import { ZOrgInviteItem } from '@/contracts/organizations/organization.query';
import { authenticatedV2, getAuthFromRequest } from '@/lib/auth/authn';
import { compose } from '@/lib/http/api-compose';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// v3/me/invites/route.ts
export const GET = compose(authenticatedV2, async (req) => {
  const auth = await getAuthFromRequest(req);

  const now = new Date();
  const where = { email: auth.user.email, expiresAt: { gt: now } };
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
