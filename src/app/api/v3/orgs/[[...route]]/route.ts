import {
  createOrg,
  deleteOrg,
  getOrg,
  listOrgs,
  slugAvailable,
  updateOrg,
} from '@/features/organization/server/org.service';
import { listOrgMems } from '@/features/organization/server/org-member.service';
import { authenticatedHono, getAuthFromRequestHono } from '@/lib/authn';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { z } from 'zod';
import { ZOrgUpdateInput } from '@/contracts/organizations/organization.input';

// == TODO: API for organizations ==
// v GET /api/orgs (list organizations current user can access)
// v POST /api/orgs (create organization)
// v GET /api/orgs/:orgId (get organization by id or slug)
// v PATCH /api/orgs/:orgId (update organization)
// v DELETE /api/orgs/:orgId (delete organization)
// v POST /api/orgs/slug-available (check slug availability)

// == TODO: API for organization invites ==
// POST /api/orgs/:orgId/invites
// GET /api/orgs/:orgId/invites (list pending invites)
// POST /api/orgs/:orgId/invites/:inviteId/resend
// POST /api/orgs/:orgId/invites/:inviteId/revoke

// == TODO: API for organization members ==
// GET /api/orgs/:orgId/members (list organization members)
// GET /api/orgs/:orgId/members/me (get current user membership)
// PATCH /api/orgs/:orgId/members/:userId (assign role to organization member)
// DELETE /api/orgs/:orgId/members/me (current user leave organization)
// DELETE /api/orgs/:orgId/members/:userId (remove organization member)
// DELETE /api/orgs/:orgId/members/:userId/transfer-ownership (transfer organization ownership)

// ========================== ORGANIZATIONS APIs ==========================
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
const ZGetByQuery = z.object({ by: z.enum(['id', 'slug']).optional() });
orgsHono.get('/:orgId', authenticatedHono, zValidator('query', ZGetByQuery), async (c) => {
  const { userId: actorId } = await getAuthFromRequestHono(c);
  const { by = 'id' } = c.req.valid('query');
  const { orgId: id } = c.req.param();

  const result = await getOrg({ id, by }, { actorId });

  return c.json(result);
});

orgsHono.delete('/:orgId', async (c) => {
  const { userId: actorId } = await getAuthFromRequestHono(c);
  const { orgId } = c.req.param();
  await deleteOrg(orgId, { actorId });
  return c.json({ id: orgId });
});

orgsHono.patch('/:orgId', zValidator('json', ZOrgUpdateInput), async (c) => {
  const { userId: actorId } = await getAuthFromRequestHono(c);
  const { orgId } = c.req.param();
  const input = c.req.valid('json');
  const result = await updateOrg(orgId, input, { actorId });
  return c.json(result);
});

orgsHono.post(
  '/slug-available',
  zValidator('json', z.object({ slug: z.string().min(3).max(50) })),
  async (c) => {
    const { slug } = c.req.valid('json');
    const available = await slugAvailable(slug);
    return c.json({ available });
  },
);

// == api/v3/orgs/:orgId/members ==
orgsHono.get('/:orgId/members', async (c) => {
  const auth = await getAuthFromRequestHono(c);
  const { orgId } = c.req.param();
  const result = await listOrgMems({ orgId }, { actorId: auth.id });
  return c.json(result);
});

// === api/v3/orgs/:orgId/invites ===

export const GET = handle(orgsHono);
export const POST = handle(orgsHono);
export const PUT = handle(orgsHono);
export const PATCH = handle(orgsHono);
export const DELETE = handle(orgsHono);
