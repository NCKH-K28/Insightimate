import { ZOrgItem } from '@/contracts/organizations/organization.query';
import { authenticatedV2 } from '@/lib/auth/authn';
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
    const { by = 'id' } = getZodQuery(req, ZQuery);
    const { orgId: id } = req.params;

    const where = by === 'id' ? { id } : by === 'slug' ? { slug: id } : { id };
    const org = await prisma.organization.findUnique({ where, include: { owner: true } });
    if (!org) throw new Response('Organization not found', { status: 404 });

    const data = ZOrgItem.parse(org);
    const result = { data };

    return NextResponse.json(result);
  },
);
