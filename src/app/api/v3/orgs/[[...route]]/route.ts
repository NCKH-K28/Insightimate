import { createOrg, deleteOrg, getOrg, listOrgs } from '@/features/organization/server/org.service';
import { authenticatedHono, getAuthFromRequestHono } from '@/lib/authn';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { z } from 'zod';

const orgsHono = new Hono().basePath('/api/v3/orgs');
orgsHono.use(authenticatedHono);

// == api/v3/orgs ==
orgsHono.get('/', async (c) => {
  const auth = await getAuthFromRequestHono(c);
  const result = await listOrgs(null, { actorId: auth.id });
  return c.json(result);
});

orgsHono.post('/', async (c) => {
  const auth = await getAuthFromRequestHono(c);
  const input = await c.req.json();
  const result = await createOrg(input, { actorId: auth.id });
  return c.json(result);
});

// == api/v3/orgs/:orgId ==
const ZQuery = z.object({ by: z.enum(['id', 'slug']).optional() });
orgsHono.get('/:orgId', authenticatedHono, zValidator('query', ZQuery), async (c) => {
  const auth = await getAuthFromRequestHono(c);
  const { by = 'id' } = c.req.valid('query');
  const { orgId: id } = c.req.param();
  const actorId = auth.id;

  const result = await getOrg({ id, by }, { actorId });

  return c.json(result);
});

orgsHono.delete('/:orgId', async (c) => {
  const auth = await getAuthFromRequestHono(c);
  const { orgId } = c.req.param();
  await deleteOrg(orgId, { actorId: auth.id });
  return c.json({ message: 'Organization deleted' });
});

orgsHono.patch('/:orgId', async (c) => {
  return c.json({ message: 'Update organization - to be implemented' });
});

// == api/v3/orgs/:orgId/members ==
orgsHono.get('/:orgId/members', async (c) => {
  return c.json({ message: 'List organization members - to be implemented' });
});

export const GET = handle(orgsHono);
export const POST = handle(orgsHono);
export const PUT = handle(orgsHono);
export const PATCH = handle(orgsHono);
export const DELETE = handle(orgsHono);
