import { Hono } from 'hono';
import { authenticatedGuard, getUserAndThrow } from '@/lib/auth';
import { httpExceptionFilterHono } from '@/lib/http/filters';
import { handle } from 'hono/vercel';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import qs from 'qs';

import { boardsService } from '@/features/boards/server/service';
import { sprintService } from '@/features/boards/server/sprint-service';
import { ZBoardIssueQueryParams } from '@/contracts/boards/board.query';
import {
  ZBoardIssueCreateInput,
  ZBoardIssueMoveInput,
  ZBoardIssueRankUpdate,
  ZBoardIssueUpdateInput,
  ZBoardSprintCompleteInput,
  ZMoveIssueInputV2,
} from '@/contracts/boards/board.input';

const boardsHono = new Hono().basePath('/api/v3/boards');
boardsHono.use(authenticatedGuard);
boardsHono.onError(httpExceptionFilterHono);

// ========================== BOARDS ==========================

// GET /api/v3/boards/:boardId
boardsHono.get('/:boardId', async (c) => {
  const { boardId } = c.req.param();
  const result = await boardsService.getById(boardId);
  return c.json(result);
});

// ========================== COLUMNS ==========================

const ZColumnCreateInput = z.object({
  name: z.string(),
  statuses: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
    }),
  ),
});

// GET /api/v3/boards/:boardId/columns
boardsHono.get('/:boardId/columns', async (c) => {
  const auth = await getUserAndThrow(c); // Validate session
  const { boardId } = c.req.param();
  const result = await boardsService.listColumns(boardId);
  return c.json(result);
});

// POST /api/v3/boards/:boardId/columns
boardsHono.post('/:boardId/columns', zValidator('json', ZColumnCreateInput), async (c) => {
  const { boardId } = c.req.param();
  const input = c.req.valid('json');
  // NOTE: Not implemented in v2 service yet, but the client expects a response
  return c.json({ id: 'dummy_col_id', name: input.name, statuses: input.statuses });
});

// POST /api/v3/boards/:boardId/columns:reorder
const ZColumnReorderInput = z.object({ ids: z.array(z.string()) });
boardsHono.post('/:boardId/columns:reorder', zValidator('json', ZColumnReorderInput), async (c) => {
  const { boardId } = c.req.param();
  const input = c.req.valid('json');
  return c.json({ success: true, ids: input.ids });
});

// ========================== ISSUES ==========================

// GET /api/v3/boards/:boardId/issues
boardsHono.get('/:boardId/issues', async (c) => {
  const auth = await getUserAndThrow(c);
  const { boardId } = c.req.param();
  // Hono doesn't parse bracket-notation query strings into nested objects,
  // but the client serialises with qs (e.g. filter[issueType][hierarchy]=2).
  const rawQs = new URL(c.req.url).search.replace(/^\?/, '');
  const query = ZBoardIssueQueryParams.parse(qs.parse(rawQs));
  // need to get board to know type (SCRUM vs KANBAN)
  const board = await boardsService.getById(boardId);
  const result = await boardsService.listIssues({ id: boardId, type: board.type }, query, {
    actorId: auth.id,
  });
  return c.json(result);
});

// POST /api/v3/boards/:boardId/issues
boardsHono.post('/:boardId/issues', zValidator('json', ZBoardIssueCreateInput), async (c) => {
  const auth = await getUserAndThrow(c);
  const { boardId } = c.req.param();
  const input = c.req.valid('json');
  const result = await boardsService.addIssue(boardId, input, { actorId: auth.id });
  return c.json(result);
});

// GET /api/v3/boards/:boardId/issues:facets
boardsHono.get('/:boardId/issues:facets', async (c) => {
  const auth = await getUserAndThrow(c);
  const { boardId } = c.req.param();
  const result = await boardsService.issueFacets(boardId, { actorId: auth.id });
  return c.json(result);
});

// GET /api/v3/boards/:boardId/issues/:issueId
boardsHono.get('/:boardId/issues/:issueId', async (c) => {
  const auth = await getUserAndThrow(c);
  const { boardId, issueId } = c.req.param();
  const result = await boardsService.getIssue({ boardId, issueId }, { actorId: auth.id });
  return c.json(result);
});

// PATCH /api/v3/boards/:boardId/issues/:issueId
boardsHono.patch(
  '/:boardId/issues/:issueId',
  zValidator('json', ZBoardIssueUpdateInput),
  async (c) => {
    const auth = await getUserAndThrow(c);
    const { boardId, issueId } = c.req.param();
    const input = c.req.valid('json');
    const result = await boardsService.updateIssue({ boardId, issueId }, input, {
      actorId: auth.id,
    });
    return c.json(result);
  },
);

// DELETE /api/v3/boards/:boardId/issues/:issueId
boardsHono.delete('/:boardId/issues/:issueId', async (c) => {
  const auth = await getUserAndThrow(c);
  const { boardId, issueId } = c.req.param();
  await boardsService.deleteIssue({ boardId, issueId }, { actorId: auth.id });
  return c.json({ success: true });
});

// POST /api/v3/boards/:boardId/issues:move  (kanban-style path-based move)
boardsHono.post('/:boardId/issues:move', zValidator('json', ZMoveIssueInputV2), async (c) => {
  const auth = await getUserAndThrow(c);
  const { boardId } = c.req.param();
  const input = c.req.valid('json');

  // Parse path-format:  /cols/<colId|null>/items/<issueId>
  const PATH_RE = /^\/cols\/([^/]+)\/items\/([^/]+)$/;
  const fromMatch = input.from.match(PATH_RE);
  const toMatch = input.to.match(PATH_RE);
  if (!fromMatch || !toMatch) {
    return c.json({ error: 'Invalid from/to format' }, 400);
  }

  const fromColId = fromMatch[1] === 'null' ? null : fromMatch[1];
  const issueId = fromMatch[2];
  const toColId = toMatch[1] === 'null' ? null : toMatch[1];
  const toRef = toMatch[2]; // issueId | 'top' | 'bottom'

  // Build relative positioning
  let relative: { type: 'top' | 'bottom' } | { type: 'after'; refId: string };
  if (toRef === 'top') {
    relative = { type: 'top' };
  } else if (toRef === 'bottom') {
    relative = { type: 'bottom' };
  } else {
    relative = { type: 'after', refId: toRef };
  }

  const moveInput = {
    parentType: 'column' as const,
    relative,
    from: { parentId: fromColId },
    to: { parentId: toColId },
  };

  const result = await boardsService.moveIssue({ boardId, issueId }, moveInput, {
    actorId: auth.id,
  });
  return c.json(result);
});

// POST /api/v3/boards/:boardId/issues/:issueId/move
boardsHono.post(
  '/:boardId/issues/:issueId/move',
  zValidator('json', ZBoardIssueMoveInput),
  async (c) => {
    const auth = await getUserAndThrow(c);
    const { boardId, issueId } = c.req.param();
    const input = c.req.valid('json');
    const result = await boardsService.moveIssue({ boardId, issueId }, input, { actorId: auth.id });
    return c.json(result);
  },
);

// POST /api/v3/boards/:boardId/issues:reorder
boardsHono.post(
  '/:boardId/issues:reorder',
  zValidator('json', ZBoardIssueRankUpdate),
  async (c) => {
    const auth = await getUserAndThrow(c);
    const { boardId } = c.req.param();
    const input = c.req.valid('json');
    const result = await boardsService.updateRank(boardId, input, { actorId: auth.id });
    return c.json(result);
  },
);

// ========================== SPRINTS ==========================

// GET /api/v3/boards/:boardId/sprints/:sprintId
boardsHono.get('/:boardId/sprints/:sprintId', async (c) => {
  const auth = await getUserAndThrow(c);
  const { boardId, sprintId } = c.req.param();
  const result = await boardsService.getSprintById({ boardId, sprintId, actorId: auth.id }, {});
  return c.json(result);
});

// POST /api/v3/boards/:boardId/sprints
boardsHono.post('/:boardId/sprints', async (c) => {
  const auth = await getUserAndThrow(c);
  const { boardId } = c.req.param();
  const input = await c.req.json().catch(() => ({}));
  const result = await boardsService.createSprint({ boardId, actorId: auth.id }, input);
  return c.json(result);
});

// PATCH /api/v3/boards/:boardId/sprints/:sprintId
const ZSprintUpdateInput = z.object({
  name: z.string().optional(),
  goal: z.string().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
});
boardsHono.patch(
  '/:boardId/sprints/:sprintId',
  zValidator('json', ZSprintUpdateInput),
  async (c) => {
    const auth = await getUserAndThrow(c);
    const { boardId, sprintId } = c.req.param();
    const input = c.req.valid('json');
    // convert strings to Date if needed
    const data = {
      ...input,
      startAt: input.startAt ? new Date(input.startAt) : undefined,
      endAt: input.endAt ? new Date(input.endAt) : undefined,
    };
    const result = await boardsService.updateSprint({ boardId, sprintId, actorId: auth.id }, data);
    return c.json(result);
  },
);

// DELETE /api/v3/boards/:boardId/sprints/:sprintId
boardsHono.delete('/:boardId/sprints/:sprintId', async (c) => {
  const auth = await getUserAndThrow(c);
  const { boardId, sprintId } = c.req.param();
  await boardsService.deleteSprint({ boardId, sprintId, actorId: auth.id });
  return c.json({ success: true });
});

// POST /api/v3/boards/:boardId/sprints/:sprintId/start
boardsHono.post('/:boardId/sprints/:sprintId/start', async (c) => {
  const auth = await getUserAndThrow(c);
  const { boardId, sprintId } = c.req.param();
  const result = await boardsService.startSprint({ boardId, sprintId, actorId: auth.id });
  return c.json(result);
});

// POST /api/v3/boards/:boardId/sprints/:sprintId/complete
boardsHono.post(
  '/:boardId/sprints/:sprintId/complete',
  zValidator('json', ZBoardSprintCompleteInput),
  async (c) => {
    const auth = await getUserAndThrow(c);
    const { boardId, sprintId } = c.req.param();
    const input = c.req.valid('json');
    const result = await boardsService.completeSprint(
      { boardId, sprintId, actorId: auth.id },
      input,
    );
    return c.json(result);
  },
);

export const GET = handle(boardsHono);
export const POST = handle(boardsHono);
export const PUT = handle(boardsHono);
export const PATCH = handle(boardsHono);
export const DELETE = handle(boardsHono);
export const OPTIONS = handle(boardsHono);
