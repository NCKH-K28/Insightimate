import { ZOrgItem } from '@/contracts/organizations/organization.query';
import { authenticatedV2, getAuthFromRequest } from '@/lib/auth/authn';
import { compose } from '@/lib/http/api-compose';
import { getZodQuery, zodQueryPipe } from '@/lib/http/zod-pipes';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import z from 'zod';

const ZQuery = z.object({ by: z.enum(['id', 'slug']).optional() });
export const GET = compose<{ orgId: string }>(
  authenticatedV2,
  zodQueryPipe(ZQuery),
  async (req) => {
    const auth = await getAuthFromRequest(req);
    const { by = 'id' } = getZodQuery(req, ZQuery);
    const { orgId: id } = req.params;
    const actorId = auth.user.id;

    const where = by === 'id' ? { id } : by === 'slug' ? { slug: id } : { id };
    const org = await prisma.organization.findUnique({
      where,
      include: { owner: true, members: { where: { userId: actorId } } },
    });
    if (!org) throw new Response('Organization not found', { status: 404 });

    const logo = org.logo ? `/api/avatar/${org.logo}` : null;
    const _me = org.members.length > 0 ? org.members[0] : null;
    const data = ZOrgItem.parse({ ...org, logo, _me });
    const result = { data };

    return NextResponse.json(result);
  },
);
