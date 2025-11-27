import z from 'zod';
import { ZBoard, ZBoardIssue, ZColumn, ZSprint } from './board';
import { ZIssueItem } from '../issues/issues.query';

// ========== Board Issues ==========
const ZBoardIssueFilter = z.object({
  type: z.enum(['KANBAN', 'SCRUM']).optional(),
  parentId: z.string().optional(),
  issueType: z.object({ hierarchy: z.coerce.number().int().optional() }).optional(),
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

export const ZBoardIssueItem = ZBoardIssue.extend(ZIssueItem.shape).extend({
  sprint: ZSprint.nullish(),
  assignee: z
    .object({ id: z.string(), name: z.string(), email: z.string(), avatar: z.string().nullable() })
    .nullable(),
  parent: ZIssueItem.shape.parent.nullish(),
  reporter: z
    .object({ id: z.string(), name: z.string(), email: z.string(), avatar: z.string().nullable() })
    .nullable(),
});

export const ZBoardIssueList = z.object({ data: ZBoardIssueItem.array(), meta: z.unknown() });

export type BoardIssueList = z.infer<typeof ZBoardIssueList>;
export type BoardIssueItem = z.infer<typeof ZBoardIssueItem>;
export type BoardIssueQueryParams = z.infer<typeof ZBoardIssueQueryParams>;
