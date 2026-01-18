import { ZOrgItem } from '@/contracts/organizations/organization.query';
import { authenticatedHono, getAuthFromRequestHono } from '@/lib/auth/authn';
import { appAPIV3 } from '@/lib/hono';
import { httpExceptionFilterHono } from '@/lib/http/filters';
import { prisma } from '@/lib/prisma';
import { zValidator } from '@hono/zod-validator';
import { handle } from 'hono/vercel';
import z from 'zod';

appAPIV3.onError(httpExceptionFilterHono);

const ZQuery = z.object({ by: z.enum(['id', 'slug']).optional() });
appAPIV3.get('/orgs/:orgId', authenticatedHono, zValidator('query', ZQuery), async (c) => {
  const auth = await getAuthFromRequestHono(c);
  const { by = 'id' } = c.req.valid('query');
  const { orgId: id } = c.req.param();
  const actorId = auth.id;
  const where = by === 'id' ? { id } : by === 'slug' ? { slug: id } : { id };
  const org = await prisma.organization.findUnique({
    where,
    include: { owner: true, members: { where: { userId: actorId } } },
  });
  if (!org) return c.notFound();

  const logo = org.logo ? `/api/avatar/${org.logo}` : null;
  const _me = org.members.length > 0 ? org.members[0] : null;
  const data = ZOrgItem.parse({ ...org, logo, _me });
  const result = { data };

  return c.json(result);
});

export const GET = handle(appAPIV3);
