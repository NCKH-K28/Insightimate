import z from 'zod';
import { ZIssue, ZIssuePriority, ZIssueResolution, ZIssueStatus, ZIssueType } from './issue';
import { ZUserPublic } from '../users';

export const ZIssueFilter = z.object({
  search: z.string().min(1).optional(),
  statusId: z.string().array().optional(),
  typeId: z.string().array().optional(),
  priorityId: z.string().array().optional(),
  assigneeId: z.string().array().optional(),
  reporterId: z.string().array().optional(),
  boardId: z.string().array().optional(),
});

export const ZIssueSort = z.object({
  field: z.enum(['createdAt', 'updatedAt', 'priorityId', 'statusId', 'typeId']),
  order: z.enum(['asc', 'desc']),
});

export const ZIssueQuery = z.object({
  page: z.number().min(1).default(1).optional(),
  limit: z.number().min(1).max(100).default(20).optional(),
  filter: ZIssueFilter.optional(),
  sort: ZIssueSort.optional(),
});

export const ZIssueMeta = z.object({
  types: ZIssueType.array(),
  statuses: ZIssueStatus.array(),
  priorities: ZIssuePriority.array(),
  resolutions: ZIssueResolution.array(),
});

export const ZIssueItem = ZIssue.extend({
  reporter: ZUserPublic.optional(),
  assignee: ZUserPublic.optional(),
  type: ZIssueType,
  status: ZIssueStatus,
  priority: ZIssuePriority,
  resolution: ZIssueResolution.optional().nullable(),
});

// facets
const ZIssueOption = z.object({
  label: z.string(),
  value: z.string(),
  count: z.number().optional(),
  iconURL: z.string().optional(),
});

export const ZIssueFacets = z.object({
  types: ZIssueOption.array().optional(),
  statuses: ZIssueOption.array().optional(),
  priorities: ZIssueOption.array().optional(),
  resolutions: ZIssueOption.array().optional(),
  assignees: ZIssueOption.array().optional(),
  reporters: ZIssueOption.array().optional(),
});

export const ZIssueListRes = z.object({ data: z.array(ZIssueItem), meta: z.any() });

export type IssueItem = z.infer<typeof ZIssueItem>;
export type IssueListRes = z.infer<typeof ZIssueListRes>;
