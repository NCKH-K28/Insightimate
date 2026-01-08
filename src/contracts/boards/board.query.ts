import z from 'zod';
import { ZBoard, ZBoardColumn, ZBoardIssue, ZColumn, ZSprint } from './board';
import { ZIssueItem } from '../issues/issue.query';

const ZUserPublic = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatar: z.string().nullable(),
});

/** Helpers / enums */
const ZBoardIssueIncludeFields = z.enum([
  'status',
  'type',
  'priority',
  'assignee',
  'sprint',
  //
]);

/** Filters / params */
const ZBoardIssueFilter = z.object({
  type: z.enum(['KANBAN', 'SCRUM']).optional(),
  parentId: z.string().optional(),
  issueType: z.object({ hierarchy: z.coerce.number().int().optional() }).optional(),
});

export const ZBoardIssueQueryParams = z.object({
  filter: ZBoardIssueFilter.optional(),
  include: z.array(ZBoardIssueIncludeFields).optional(),
});

/** Items */
export const ZBoardItem = ZBoard.extend({
  sprints: ZSprint.array().optional(),
  columns: ZColumn.array().optional(),
});

export const ZBoardIssueItem = ZBoardIssue.extend(ZIssueItem.shape).extend({
  sprint: ZSprint.nullish(),
  assignee: ZUserPublic.nullable(),
  parent: ZIssueItem.shape.parent.nullish(),
  reporter: ZUserPublic.nullable(),

  _children: z.object({ total: z.number(), done: z.number() }).nullish(),
});

/** Lists */
export const ZBoardIssueList = z.object({
  data: ZBoardIssueItem.array(),
  meta: z.unknown(),
});

/** Column / Sprint re-exports */
/** Small schemas */
const ZStatusCol = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullish(),
  category: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
});

export const ZBoardColumnItem = ZBoardColumn.extend({
  statuses: ZStatusCol.array(),
});
export const ZBoardColumnList = z.object({
  data: ZBoardColumnItem.array(),
  meta: z.unknown(),
});

export const ZSprintItem = ZSprint.extend({ projectId: z.string() });

/** Types */
export type BoardIssueQueryParams = z.infer<typeof ZBoardIssueQueryParams>;
export type BoardIssueItem = z.infer<typeof ZBoardIssueItem>;
export type BoardIssueList = z.infer<typeof ZBoardIssueList>;

export type BoardColumnItem = z.infer<typeof ZBoardColumnItem>;
export type BoardColumnList = z.infer<typeof ZBoardColumnList>;
export type SprintItem = z.infer<typeof ZSprintItem>;

// ================ Sprint [Summary] ================ //
const ZCounts = z.object({ total: z.number(), done: z.number() }).catchall(z.number());
const ZPoints = z.object({ total: z.number(), done: z.number() }).catchall(z.number());
const ZBreakdownItem = z.object({
  key: z.string(),
  display: z.string().optional(),
  counts: ZCounts,
  points: ZPoints.optional(),
});

const ZMetrics = z.object({
  asOf: z.string().optional(),
  counts: ZCounts,
  points: ZPoints,
  scope: z.object({ addedAfterStart: z.number().optional() }),
  breakdowns: z
    .object({
      status: ZBreakdownItem.array().optional(),
      type: ZBreakdownItem.array().optional(),
      priority: ZBreakdownItem.array().optional(),
    })
    .optional(),
});

export const ZSprintSummary = z.object({
  id: z.string(),
  name: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  metrics: ZMetrics.optional(),
});

export type SprintSummary = z.infer<typeof ZSprintSummary>;
export type BreakdownItem = z.infer<typeof ZBreakdownItem>;

// ================ Reports ================ //
const ZChartParams = z.object({
  unit: z.literal('points'),
  interval: z.literal('daily'),
  from: z.string(),
  to: z.string(),
  asOf: z.string(),
});
export const ZBunrdownChart = z.object({
  type: z.literal('burndown'),
  params: ZChartParams,
  series: z.object({ date: z.string(), remaining: z.number(), ideal: z.number() }).array(),
});

export const ZBurnupChart = z.object({
  type: z.literal('burnup'),
  params: ZChartParams,
  series: z.object({ date: z.string(), completed: z.number(), scope: z.number() }).array(),
});

export const ZCumulativeFlowDiagramChart = z.object({
  type: z.literal('cfd'),
  params: ZChartParams,
  series: z.object({ date: z.string(), status: z.string(), count: z.number() }).array(),
});

export type BunrdownChart = z.infer<typeof ZBunrdownChart>;
export type BurnupChart = z.infer<typeof ZBurnupChart>;
export type CumulativeFlowDiagramChart = z.infer<typeof ZCumulativeFlowDiagramChart>;

// scope
// throughput
// cycle-time
