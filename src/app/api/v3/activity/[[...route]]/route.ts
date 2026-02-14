import { Hono } from 'hono';
import { authenticatedGuard, getUserAndThrow } from '@/lib/auth';
import { httpExceptionFilterHono } from '@/lib/http/filters';
import { handle } from 'hono/vercel';
import { zValidator } from '@hono/zod-validator';
import { ZActivityFeedQuery } from '@/contracts/activity';
import { activityEventService } from '@/features/activity/server/activity-event.service';
import { openfgaClient } from '@/lib/authz/clients/openfga';

const activityHono = new Hono().basePath('/api/v3/activity');
activityHono.use(authenticatedGuard);
activityHono.onError(httpExceptionFilterHono);

// GET /api/v3/activity — Activity feed (org-level, with optional project filter)
activityHono.get('/', zValidator('query', ZActivityFeedQuery), async (c) => {
  const auth = await getUserAndThrow(c);
  const query = c.req.valid('query');

  let allowedProjectIds: string[] | undefined;

  if (!query.projectId) {
    // Org-level feed: fetch all projects the user can view
    const { objects } = await openfgaClient.listObjects({
      user: `user:${auth.id}`,
      type: 'proj',
      relation: 'read',
    });
    allowedProjectIds = objects.map((o) => o.replace('proj:', ''));
  }

  const result = await activityEventService.list(query, allowedProjectIds);

  // Serialize dates to ISO strings
  const items = result.items.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
  }));

  return c.json({ items, nextCursor: result.nextCursor });
});

export const GET = handle(activityHono);
