import z from 'zod';
import { isoDateString, isoString } from '../_shared';

// ── Sprint Response ──────────────────────────────────────────────────────
export const ZSprintResponse = z.object({
  id: z.string(),
  name: z.string(),
  state: z.enum(['FUTURE', 'ACTIVE', 'CLOSED']),
  boardId: z.string(),
  startAt: isoDateString.nullable(),
  endAt: isoDateString.nullable(),
  goal: z.string().nullable(),
  sequence: z.number(),
  committedPoints: z.number().nullable().optional(),
  createdAt: isoString,
  updatedAt: isoString,
});

export type SprintResponse = z.infer<typeof ZSprintResponse>;

// ── Sprint Create Input ──────────────────────────────────────────────────
export const ZSprintCreateInput = z.object({
  boardId: z.string(),
  name: z.string().min(1, 'Sprint name is required').optional(),
  goal: z.string().nullish(),
  startAt: z.string().optional().nullable(),
  endAt: z.string().optional().nullable(),
});

export type SprintCreateInput = z.infer<typeof ZSprintCreateInput>;

// ── Sprint Update Input ──────────────────────────────────────────────────
export const ZSprintUpdateInput = z.object({
  name: z.string().min(1, 'Sprint name is required').optional(),
  goal: z.string().nullish(),
  startAt: z.string().optional().nullable(),
  endAt: z.string().optional().nullable(),
});

export type SprintUpdateInput = z.infer<typeof ZSprintUpdateInput>;

// ── Sprint Complete Input ────────────────────────────────────────────────
type ToMoveToSprint = `to:sp_${string}`;
const ZMoveToSprint = z
  .string()
  .regex(
    /^to:sp_[a-zA-Z0-9]+$/,
    'Invalid sprint ID format: to:<sprintId>',
  ) as z.ZodType<ToMoveToSprint>;

export const ZSprintCompleteInput = z.object({
  effect: z.union([
    z.literal('delete'),
    z.literal('to:backlog'),
    z.literal('to:new_sprint'),
    ZMoveToSprint,
  ]),
});

export type SprintCompleteInput = z.infer<typeof ZSprintCompleteInput>;

// ── Sprint Add Issues Input ──────────────────────────────────────────────
export const ZSprintAddIssuesInput = z.object({
  issueIds: z.string().array().min(1, 'At least one issue ID is required'),
});

export type SprintAddIssuesInput = z.infer<typeof ZSprintAddIssuesInput>;

// ── Sprint List Query ────────────────────────────────────────────────────
export const ZSprintListQuery = z.object({
  boardId: z.string(),
  state: z.enum(['FUTURE', 'ACTIVE', 'CLOSED']).optional(),
});

export type SprintListQuery = z.infer<typeof ZSprintListQuery>;

// ── Re-export existing chart/summary schemas from board contracts ────────
export {
  ZSprintSummary,
  ZBunrdownChart,
  ZBurnupChart,
  type SprintSummary,
  type BunrdownChart,
  type BurnupChart,
} from '../boards/board.query';
