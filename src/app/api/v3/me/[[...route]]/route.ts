import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { ZOrgInviteItem } from '@/contracts/organization/organization.query';
import { ZUserUpdateInput, ZChangePasswordInput } from '@/contracts/user/user.input';
import { ZProfileUpdateInput } from '@/contracts/user/profile';
import { ZUser, ZUserPublic } from '@/contracts/user';
import { orgInvitationService } from '@/features/organization/server/org-invitation.service';
import { inviteToken } from '@/features/organization/server/invite-token';
import { userService } from '@/features/user/server/user.service';
import { authenticatedGuard, getUserAndThrow } from '@/lib/auth';

const ZOrgInviteAcceptInput = z.object({ token: z.string().min(1, 'Token is required') });
const ZOrgInviteRejectInput = z.object({ token: z.string().min(1, 'Token is required') });

const meHono = new Hono().basePath('/api/v3/me');
meHono.use(authenticatedGuard);

// ─── User identity ───────────────────────────────────────────────────────────

meHono.get('/', async (c) => {
  const user = await getUserAndThrow(c);
  const fullUser = await userService.getMe(user.id);
  const result = ZUser.parse(fullUser);
  return c.json(result);
});

meHono.put('/', zValidator('json', ZUserUpdateInput), async (c) => {
  const user = await getUserAndThrow(c);
  const input = ZUserUpdateInput.parse(await c.req.json());
  const updatedUser = await userService.updateMe(user.id, input);
  const result = ZUser.parse(updatedUser);
  return c.json(result);
});

meHono.patch('/', zValidator('json', ZUserUpdateInput), async (c) => {
  const user = await getUserAndThrow(c);
  const input = ZUserUpdateInput.parse(await c.req.json());
  const updatedUser = await userService.updateMe(user.id, input);
  const result = ZUser.parse(updatedUser);
  return c.json(result);
});

// ─── Profile (preferences/settings) ──────────────────────────────────────────

meHono.get('/profile', async (c) => {
  const user = await getUserAndThrow(c);
  const profile = await userService.getProfile(user.id);
  return c.json(profile);
});

meHono.patch('/profile', zValidator('json', ZProfileUpdateInput), async (c) => {
  const user = await getUserAndThrow(c);
  const input = ZProfileUpdateInput.parse(await c.req.json());
  const profile = await userService.updateProfile(user.id, input);
  return c.json(profile);
});

// ─── Password ────────────────────────────────────────────────────────────────

meHono.put('/password', zValidator('json', ZChangePasswordInput), async (c) => {
  const user = await getUserAndThrow(c);
  const input = ZChangePasswordInput.parse(await c.req.json());
  try {
    await userService.changePassword(user.id, input, c.req.raw.headers);
    return c.json({ ok: true });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to change password' },
      400,
    );
  }
});

// ─── Org invitations ─────────────────────────────────────────────────────────

meHono.get('/orgs/invitees', async (c) => {
  const user = await getUserAndThrow(c);
  const invitations = await orgInvitationService.listMy({ email: user.email });
  const data = ZOrgInviteItem.array().parse(invitations);
  return c.json({ data, meta: { total: data.length } });
});


meHono.post('/orgs/invitees/accept', zValidator('json', ZOrgInviteAcceptInput), async (c) => {
  const user = await getUserAndThrow(c);
  const { token } = c.req.valid('json');
  const payload = await inviteToken.verify(token);
  if (payload.email !== user.email) {
    return c.json({ error: 'Invalid invitation token' }, 400);
  }
  const data = await orgInvitationService.accept({ token }, { actorId: user.id });
  return c.json({ data });
});

meHono.post('/orgs/invitees/reject', zValidator('json', ZOrgInviteRejectInput), async (c) => {
  const user = await getUserAndThrow(c);
  const { token } = c.req.valid('json');
  const payload = await inviteToken.verify(token);
  if (payload.email !== user.email) {
    return c.json({ error: 'Invalid invitation token' }, 400);
  }

  const data = await orgInvitationService.reject({ token }, { actorId: user.id });
  return c.json({ data });
});

// == New endpoints for invite page ==
// GET /api/v3/me/orgs/invite?token=xxx - Preview invitation
meHono.get('/orgs/invite', zValidator('query', z.object({ token: z.string() })), async (c) => {
  const user = await getUserAndThrow(c);
  const { token } = c.req.valid('query');

  try {
    const payload = await inviteToken.verify(token);
    const invitation = await orgInvitationService.preview({ token }, { actorId: user.id });

    return c.json({
      organization: {
        id: invitation.organization.id,
        name: invitation.organization.name,
        logoURL: invitation.organization.logo,
      },
      invitation: {
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt.toISOString(),
      },
      inviter: {
        id: invitation.inviter.id,
        name: invitation.inviter.name,
        email: invitation.inviter.email,
      },
    });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch invite info' },
      400,
    );
  }
});

// POST /api/v3/me/orgs/:orgId/invite/accept?token=xxx
meHono.post(
  '/orgs/:orgId/invite/accept',
  zValidator('query', z.object({ token: z.string() })),
  async (c) => {
    const user = await getUserAndThrow(c);
    const { token } = c.req.valid('query');
    const { orgId } = c.req.param();

    try {
      const payload = await inviteToken.verify(token);
      if (payload.sub !== orgId) {
        return c.json({ error: 'Token does not match organization' }, 400);
      }

      const result = await orgInvitationService.accept({ token }, { actorId: user.id });
      return c.json(result);
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : 'Failed to accept invite' },
        400,
      );
    }
  },
);

// POST /api/v3/me/orgs/:orgId/invite/reject?token=xxx
meHono.post(
  '/orgs/:orgId/invite/reject',
  zValidator('query', z.object({ token: z.string() })),
  async (c) => {
    const user = await getUserAndThrow(c);
    const { token } = c.req.valid('query');
    const { orgId } = c.req.param();

    try {
      const payload = await inviteToken.verify(token);
      if (payload.sub !== orgId) {
        return c.json({ error: 'Token does not match organization' }, 400);
      }

      await orgInvitationService.reject({ token }, { actorId: user.id });
      return c.json({ ok: true });
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : 'Failed to reject invite' },
        400,
      );
    }
  },
);

export const GET = handle(meHono);
export const POST = handle(meHono);
export const PUT = handle(meHono);
export const PATCH = handle(meHono);
export const DELETE = handle(meHono);
