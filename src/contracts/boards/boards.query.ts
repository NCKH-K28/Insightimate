import z from 'zod';
import { ZBoard, ZBoardIssue, ZColumn, ZSprint } from './board';

// ========== Board Issues ==========
const ZBoardIssueFilter = z.object({
  type: z.enum(['KANBAN', 'SCRUM']).optional(),
  parentId: z.string().optional(),
});

const ZBoardIssueIncludeFields = z.enum([
  'status',
  'type',
  'priority',
  'assignee',
  'sprint',
  //
]);

export const ZBoardIssueQueryParams = z.object({
  filter: ZBoardIssueFilter.optional(),
  include: z.array(ZBoardIssueIncludeFields).optional(),
});

export const ZBoardItem = ZBoard.extend({
  sprints: ZSprint.array().optional(),
  columns: ZColumn.array().optional(),
});

const ZField = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  iconURL: z.string().nullish(),
  color: z.string().nullish(),
});

export const ZBoardIssueItem = ZBoardIssue.extend({
  status: ZField,
  type: ZField,
  priority: ZField,
  assignee: z
    .object({ id: z.string(), name: z.string(), email: z.string(), avatar: z.string().nullable() })
    .nullable(),
  // ===
  sprint: ZSprint.nullish(),
});
export const ZBoardIssueList = z.object({ data: ZBoardIssueItem.array(), meta: z.unknown() });

export type BoardIssueList = z.infer<typeof ZBoardIssueList>;
export type BoardIssueItem = z.infer<typeof ZBoardIssueItem>;
export type BoardIssueQueryParams = z.infer<typeof ZBoardIssueQueryParams>;
