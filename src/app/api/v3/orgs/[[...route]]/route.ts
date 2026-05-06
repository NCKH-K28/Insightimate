import {
  createOrg,
  deleteOrg,
  getOrg,
  listOrgs,
  slugAvailable,
  updateOrg,
} from '@/features/organization/server/org.service';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { z } from 'zod';
import { ZOrgUpdateInput } from '@/contracts/organization/organization.input';
import { httpExceptionFilterHono } from '@/lib/http/filters';
import { ZOrgMemberInviteInput } from '@/contracts/organization/organization.query';
import { orgInvitationService } from '@/features/organization/server/org-invitation.service';
import { orgMemberService } from '@/features/organization/server/org-member.service';
import { authenticatedGuard, getUserAndThrow } from '@/lib/auth';
import { teamsService } from '@/features/teams/server/teams.service';
import { ZTeamCreateInput, ZTeamUpdateInput } from '@/contracts/teams';
import { ZNotificationListQuery, ZNotificationSnoozeInput } from '@/contracts/notifications';
import { notificationsService } from '@/features/notifications/server/notifications.service';

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
orgsHono.use(authenticatedGuard);
orgsHono.onError(httpExceptionFilterHono);

const resolveOrgId = async (id: string, actorId: string) => {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const isCuid = /^[a-z0-9]{24,32}$/i.test(id);
  if (isUuid || isCuid) return id;
  const org = await getOrg({ id, by: 'slug' }, { actorId });
  return org.id;
};

// == api/v3/orgs ==
orgsHono.get('/', async (c) => {
  const { id: actorId } = await getUserAndThrow(c);
  const result = await listOrgs(null, { actorId });
  return c.json(result);
});

orgsHono.post('/', async (c) => {
  const user = await getUserAndThrow(c);
  const input = await c.req.json();
  const result = await createOrg(input, { actorId: user.id });
  return c.json(result);
});

// == api/v3/orgs/:orgId ==
const ZGetByQuery = z.object({ by: z.enum(['id', 'slug']).optional() });
orgsHono.get('/:orgId', zValidator('query', ZGetByQuery), async (c) => {
  const { id: actorId } = await getUserAndThrow(c);
  const { by = 'id' } = c.req.valid('query');
  const { orgId: id } = c.req.param();

  const result = await getOrg({ id, by }, { actorId });

  return c.json(result);
});

orgsHono.delete('/:orgId', async (c) => {
  const { id: actorId } = await getUserAndThrow(c);
  const { orgId } = c.req.param();
  await deleteOrg(orgId, { actorId });
  return c.json({ id: orgId });
});

orgsHono.patch('/:orgId', zValidator('json', ZOrgUpdateInput), async (c) => {
  const { id: actorId } = await getUserAndThrow(c);
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
  const { id: actorId } = await getUserAndThrow(c);
  const { orgId } = c.req.param();
  const result = await orgMemberService.list({ orgId }, { actorId });
  return c.json(result);
});

orgsHono.post(
  '/:orgId/members/invite',
  zValidator('json', ZOrgMemberInviteInput.omit({ orgId: true })),
  async (c) => {
    const { id: actorId } = await getUserAndThrow(c);
    const { orgId } = c.req.param();
    const input = c.req.valid('json');
    const result = await orgInvitationService.bulkInvite({ ...input, orgId }, { actorId });
    return c.json(result);
  },
);

// === api/v3/orgs/:orgId/invites ===
orgsHono.get(
  '/invitations/preview',
  zValidator('query', z.object({ token: z.string() })),
  async (c) => {
    const { id: actorId } = await getUserAndThrow(c);
    const { token } = c.req.valid('query');
    // Using auth.userId, assuming user is logged in as per (authed) route structure
    const result = await orgInvitationService.preview({ token }, { actorId });
    return c.json({ data: result });
  },
);

orgsHono.get('/:orgId/invitations', async (c) => {
  const { id: actorId } = await getUserAndThrow(c);
  const { orgId } = c.req.param();
  const result = await orgInvitationService.list({ orgId }, { actorId });
  return c.json({ data: result });
});

const ZInviteAction = z.object({ email: z.string().email() });

orgsHono.post('/:orgId/invitations/revoke', zValidator('json', ZInviteAction), async (c) => {
  const { id: actorId } = await getUserAndThrow(c);
  const { orgId } = c.req.param();
  const { email } = c.req.valid('json');
  await orgInvitationService.revoke({ orgId, email }, { actorId });
  return c.json({ ok: true });
});

orgsHono.post('/:orgId/invitations/resend', zValidator('json', ZInviteAction), async (c) => {
  const { id: actorId } = await getUserAndThrow(c);
  const { orgId } = c.req.param();
  const { email } = c.req.valid('json');
  await orgInvitationService.resend({ orgId, email }, { actorId });
  return c.json({ ok: true });
});

const ZOrgRole = z.enum(['ORG_OWNER', 'ORG_ADMIN', 'ORG_MEMBER']);

// == api/v3/orgs/:orgId/members/:userId ==
orgsHono.patch(
  '/:orgId/members/:userId',
  zValidator('json', z.object({ role: ZOrgRole })),
  async (c) => {
    const { id: actorId } = await getUserAndThrow(c);
    const { orgId, userId } = c.req.param();
    const { role } = c.req.valid('json');
    const result = await orgMemberService.assign({ orgId, userId, role }, { actorId });
    return c.json(result);
  },
);

orgsHono.delete('/:orgId/members/me', async (c) => {
  const { id: actorId } = await getUserAndThrow(c);
  const { orgId } = c.req.param();
  await orgMemberService.leave({ orgId, userId: actorId }, { actorId });
  return c.json({ ok: true });
});

orgsHono.delete('/:orgId/members/:userId', async (c) => {
  const { id: actorId } = await getUserAndThrow(c);
  const { orgId, userId } = c.req.param();
  await orgMemberService.remove({ orgId, userId }, { actorId });
  return c.json({ ok: true });
});

// ========================== TEAMS APIs ==========================
orgsHono.get('/:orgId/teams', async (c) => {
  const { id: actorId } = await getUserAndThrow(c);
  const { orgId: rawOrgId } = c.req.param();
  const orgId = await resolveOrgId(rawOrgId, actorId);
  const result = await teamsService.listTeams(null, { actorId, orgId });
  return c.json(result);
});

orgsHono.post('/:orgId/teams', zValidator('json', ZTeamCreateInput), async (c) => {
  const { id: actorId } = await getUserAndThrow(c);
  const { orgId: rawOrgId } = c.req.param();
  const orgId = await resolveOrgId(rawOrgId, actorId);
  const input = c.req.valid('json');
  const result = await teamsService.createTeam(input, { actorId, orgId });
  return c.json(result, { status: 201 });
});

orgsHono.get('/:orgId/teams/:teamId', async (c) => {
  const { id: actorId } = await getUserAndThrow(c);
  const { orgId: rawOrgId, teamId } = c.req.param();
  const orgId = await resolveOrgId(rawOrgId, actorId);
  const result = await teamsService.getTeamById(
    teamId,
    { actorId, orgId },
    { include: { members: true } },
  );
  return c.json(result);
});

orgsHono.patch('/:orgId/teams/:teamId', zValidator('json', ZTeamUpdateInput), async (c) => {
  const { id: actorId } = await getUserAndThrow(c);
  const { orgId: rawOrgId, teamId } = c.req.param();
  const orgId = await resolveOrgId(rawOrgId, actorId);
  const input = c.req.valid('json');
  const result = await teamsService.updateTeam(teamId, input, { actorId, orgId });
  return c.json(result);
});

orgsHono.delete('/:orgId/teams/:teamId', async (c) => {
  const { id: actorId } = await getUserAndThrow(c);
  const { orgId: rawOrgId, teamId } = c.req.param();
  const orgId = await resolveOrgId(rawOrgId, actorId);
  await teamsService.deleteTeamById(teamId, { actorId, orgId });
  return c.json({ id: teamId });
});

orgsHono.get('/:orgId/teams/:teamId/members', async (c) => {
  const { id: actorId } = await getUserAndThrow(c);
  const { orgId: rawOrgId, teamId } = c.req.param();
  const orgId = await resolveOrgId(rawOrgId, actorId);
  const result = await teamsService.getTeamById(
    teamId,
    { actorId, orgId },
    { include: { members: true } },
  );
  return c.json({ data: result.members || [] });
});

const ZTeamMemberAddInput = z.object({ userIds: z.array(z.string().min(1)) });

orgsHono.post(
  '/:orgId/teams/:teamId/members',
  zValidator('json', ZTeamMemberAddInput),
  async (c) => {
    const { id: actorId } = await getUserAndThrow(c);
    const { orgId: rawOrgId, teamId } = c.req.param();
    const orgId = await resolveOrgId(rawOrgId, actorId);
    const { userIds } = c.req.valid('json');
    const result = await teamsService.addMembers(teamId, userIds, { actorId, orgId });
    return c.json(result, { status: 201 });
  },
);

orgsHono.delete('/:orgId/teams/:teamId/members/:userId', async (c) => {
  const { id: actorId } = await getUserAndThrow(c);
  const { orgId: rawOrgId, teamId, userId } = c.req.param();
  const orgId = await resolveOrgId(rawOrgId, actorId);
  await teamsService.removeMember(teamId, userId, { actorId, orgId });
  return c.json({ ok: true });
});

// ========================== NOTIFICATIONS APIs ==========================

// GET /api/v3/orgs/:orgId/notifications - List notifications
orgsHono.get('/:orgId/notifications', zValidator('query', ZNotificationListQuery), async (c) => {
  const { id: actorId } = await getUserAndThrow(c);
  const { orgId } = c.req.param();
  const query = c.req.valid('query');
  const result = await notificationsService.list(orgId, query, { actorId });
  return c.json(result);
});

// GET /api/v3/orgs/:orgId/notifications/unread-count
orgsHono.get('/:orgId/notifications/unread-count', async (c) => {
  const { id: actorId } = await getUserAndThrow(c);
  const { orgId } = c.req.param();
  const result = await notificationsService.getUnreadCount(orgId, { actorId });
  return c.json(result);
});

// POST /api/v3/orgs/:orgId/notifications/:id/read
orgsHono.post('/:orgId/notifications/:id/read', async (c) => {
  const { id: actorId } = await getUserAndThrow(c);
  const { id } = c.req.param();
  const result = await notificationsService.markRead(id, { actorId });
  return c.json(result);
});

// DELETE /api/v3/orgs/:orgId/notifications/:id/read
orgsHono.delete('/:orgId/notifications/:id/read', async (c) => {
  const { id: actorId } = await getUserAndThrow(c);
  const { id } = c.req.param();
  const result = await notificationsService.markUnread(id, { actorId });
  return c.json(result);
});

// POST /api/v3/orgs/:orgId/notifications/:id/archive
orgsHono.post('/:orgId/notifications/:id/archive', async (c) => {
  const { id: actorId } = await getUserAndThrow(c);
  const { id } = c.req.param();
  const result = await notificationsService.archive(id, { actorId });
  return c.json(result);
});

// PATCH /api/v3/orgs/:orgId/notifications/:id - Snooze
orgsHono.patch(
  '/:orgId/notifications/:id',
  zValidator('json', ZNotificationSnoozeInput),
  async (c) => {
    const { id: actorId } = await getUserAndThrow(c);
    const { id } = c.req.param();
    const input = c.req.valid('json');
    const result = await notificationsService.snooze(id, input, { actorId });
    return c.json(result);
  },
);

// POST /api/v3/orgs/:orgId/notifications/mark-all-read
orgsHono.post('/:orgId/notifications/mark-all-read', async (c) => {
  const { id: actorId } = await getUserAndThrow(c);
  const { orgId } = c.req.param();
  const result = await notificationsService.markAllRead(orgId, { actorId });
  return c.json(result);
});

export const GET = handle(orgsHono);
export const POST = handle(orgsHono);
export const PUT = handle(orgsHono);
export const PATCH = handle(orgsHono);
export const DELETE = handle(orgsHono);
