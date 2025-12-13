import z from 'zod';
import { ZBoard, ZBoardColumn, ZBoardIssue, ZColumn, ZSprint } from './board';
import { ZIssueItem } from '../issues/issues.query';

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
});

/** Lists */
export const ZBoardIssueList = z.object({
  data: ZBoardIssueItem.array(),
  meta: z.unknown(),
});

/** Column / Sprint re-exports */
/** Small schemas */
const ZStatusCol = z.object({ id: z.string(), name: z.string(), color: z.string().nullish() });

export const ZBoardColumnItem = ZBoardColumn.extend({
  statuses: ZStatusCol.array(),
});
export const ZBoardColumnList = z.object({
  data: ZBoardColumnItem.array(),
  meta: z.unknown(),
});

export const ZSprintItem = ZSprint;

/** Types */
export type BoardIssueQueryParams = z.infer<typeof ZBoardIssueQueryParams>;
export type BoardIssueItem = z.infer<typeof ZBoardIssueItem>;
export type BoardIssueList = z.infer<typeof ZBoardIssueList>;

export type BoardColumnItem = z.infer<typeof ZBoardColumnItem>;
export type BoardColumnList = z.infer<typeof ZBoardColumnList>;
export type SprintItem = z.infer<typeof ZSprintItem>;
