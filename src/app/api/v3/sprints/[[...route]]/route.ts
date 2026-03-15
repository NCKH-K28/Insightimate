import { Hono } from 'hono';
import { authenticatedGuard, getUserAndThrow } from '@/lib/auth';
import { httpExceptionFilterHono } from '@/lib/http/filters';
import { handle } from 'hono/vercel';
import { zValidator } from '@hono/zod-validator';
import {
  ZSprintCreateInput,
  ZSprintUpdateInput,
  ZSprintCompleteInput,
  ZSprintAddIssuesInput,
  ZSprintListQuery,
  ZSprintUserPreferenceInput,
  ZSprintTransferInput,
} from '@/contracts/sprints';
import { sprintsService } from '@/features/sprints/server/sprints.service';
import { z } from 'zod';

const sprintsHono = new Hono().basePath('/api/v3/sprints');
sprintsHono.use(authenticatedGuard);
sprintsHono.onError(httpExceptionFilterHono);

// ========================== SPRINT CRUD APIs ==========================

// GET /api/v3/sprints?boardId=&state= or ?projectId=&state= - List sprints
sprintsHono.get('/', zValidator('query', ZSprintListQuery), async (c) => {
  const auth = await getUserAndThrow(c);
  const { boardId, projectId, state } = c.req.valid('query');

  if (projectId) {
    const result = await sprintsService.listByProject(projectId, { state }, { actorId: auth.id });
    return c.json(result);
  }

  const result = await sprintsService.list({ boardId: boardId!, state }, { actorId: auth.id });
  return c.json(result);
});

// POST /api/v3/sprints - Create sprint
sprintsHono.post('/', zValidator('json', ZSprintCreateInput), async (c) => {
  const auth = await getUserAndThrow(c);
  const input = c.req.valid('json');
  const result = await sprintsService.create(input, { actorId: auth.id });
  return c.json(result, 201);
});

// GET /api/v3/sprints/:sprintId - Get sprint by ID
sprintsHono.get('/:sprintId', async (c) => {
  const auth = await getUserAndThrow(c);
  const { sprintId } = c.req.param();
  const result = await sprintsService.getById(sprintId, { actorId: auth.id });
  return c.json(result);
});

// PATCH /api/v3/sprints/:sprintId - Update sprint
sprintsHono.patch(
  '/:sprintId',
  zValidator('json', ZSprintUpdateInput),
  async (c) => {
    const auth = await getUserAndThrow(c);
    const { sprintId } = c.req.param();
    const input = c.req.valid('json');
    const result = await sprintsService.update(sprintId, input, { actorId: auth.id });
    return c.json(result);
  },
);

// DELETE /api/v3/sprints/:sprintId - Delete sprint
sprintsHono.delete('/:sprintId', async (c) => {
  const auth = await getUserAndThrow(c);
  const { sprintId } = c.req.param();
  const result = await sprintsService.delete(sprintId, { actorId: auth.id });
  return c.json(result);
});

// ========================== SPRINT LIFECYCLE APIs ==========================

// POST /api/v3/sprints/:sprintId/start - Start sprint
sprintsHono.post('/:sprintId/start', async (c) => {
  const auth = await getUserAndThrow(c);
  const { sprintId } = c.req.param();
  const result = await sprintsService.start(sprintId, { actorId: auth.id });
  return c.json(result);
});

// POST /api/v3/sprints/:sprintId/complete - Complete sprint
sprintsHono.post(
  '/:sprintId/complete',
  zValidator('json', ZSprintCompleteInput),
  async (c) => {
    const auth = await getUserAndThrow(c);
    const { sprintId } = c.req.param();
    const input = c.req.valid('json');
    const result = await sprintsService.complete(sprintId, input, { actorId: auth.id });
    return c.json(result);
  },
);

// ========================== SPRINT ISSUES APIs ==========================

// GET /api/v3/sprints/:sprintId/issues - List issues in sprint
sprintsHono.get('/:sprintId/issues', async (c) => {
  const auth = await getUserAndThrow(c);
  const { sprintId } = c.req.param();
  const result = await sprintsService.listIssues(sprintId, { actorId: auth.id });
  return c.json(result);
});

// POST /api/v3/sprints/:sprintId/issues - Add issues to sprint
sprintsHono.post(
  '/:sprintId/issues',
  zValidator('json', ZSprintAddIssuesInput),
  async (c) => {
    const auth = await getUserAndThrow(c);
    const { sprintId } = c.req.param();
    const input = c.req.valid('json');
    const result = await sprintsService.addIssues(sprintId, input, { actorId: auth.id });
    return c.json(result);
  },
);

// DELETE /api/v3/sprints/:sprintId/issues/:issueId - Remove issue from sprint
sprintsHono.delete('/:sprintId/issues/:issueId', async (c) => {
  const auth = await getUserAndThrow(c);
  const { sprintId, issueId } = c.req.param();
  const result = await sprintsService.removeIssue(sprintId, issueId, { actorId: auth.id });
  return c.json(result);
});

// ========================== SPRINT REPORTS & SUMMARY APIs ==========================

// GET /api/v3/sprints/:sprintId/reports?type=burndown|burnup - Sprint reports
const ZReportQuery = z.object({
  type: z.enum(['burndown', 'burnup']).optional(),
});

sprintsHono.get(
  '/:sprintId/reports',
  zValidator('query', ZReportQuery),
  async (c) => {
    const auth = await getUserAndThrow(c);
    const { sprintId } = c.req.param();
    const { type } = c.req.valid('query');
    const result = await sprintsService.reports(sprintId, { actorId: auth.id }, { type });
    return c.json(result);
  },
);

// GET /api/v3/sprints/:sprintId/summary - Sprint summary
sprintsHono.get('/:sprintId/summary', async (c) => {
  const auth = await getUserAndThrow(c);
  const { sprintId } = c.req.param();
  const result = await sprintsService.summary(sprintId, { actorId: auth.id });
  return c.json(result);
});

// ========================== USER PREFERENCES APIs ==========================

// GET /api/v3/sprints/:sprintId/user-preferences - Get user preferences
sprintsHono.get('/:sprintId/user-preferences', async (c) => {
  const auth = await getUserAndThrow(c);
  const { sprintId } = c.req.param();
  const result = await sprintsService.getUserPreferences(sprintId, { actorId: auth.id });
  return c.json(result);
});

// PATCH /api/v3/sprints/:sprintId/user-preferences - Update user preferences
sprintsHono.patch(
  '/:sprintId/user-preferences',
  zValidator('json', ZSprintUserPreferenceInput),
  async (c) => {
    const auth = await getUserAndThrow(c);
    const { sprintId } = c.req.param();
    const input = c.req.valid('json');
    const result = await sprintsService.updateUserPreferences(sprintId, input, { actorId: auth.id });
    return c.json(result);
  },
);

// ========================== ANALYTICS APIs ==========================

// GET /api/v3/sprints/:sprintId/analytics - Sprint analytics
sprintsHono.get('/:sprintId/analytics', async (c) => {
  const auth = await getUserAndThrow(c);
  const { sprintId } = c.req.param();
  const result = await sprintsService.getAnalytics(sprintId, { actorId: auth.id });
  return c.json(result);
});

// ========================== SPRINT TRANSFER API ==========================

// POST /api/v3/sprints/:sprintId/transfer - Transfer incomplete issues
sprintsHono.post(
  '/:sprintId/transfer',
  zValidator('json', ZSprintTransferInput),
  async (c) => {
    const auth = await getUserAndThrow(c);
    const { sprintId } = c.req.param();
    const { targetSprintId } = c.req.valid('json');
    const result = await sprintsService.transferIncomplete(sprintId, targetSprintId, { actorId: auth.id });
    return c.json(result);
  },
);

export const GET = handle(sprintsHono);
export const POST = handle(sprintsHono);
export const PUT = handle(sprintsHono);
export const PATCH = handle(sprintsHono);
export const DELETE = handle(sprintsHono);
export const OPTIONS = handle(sprintsHono);
