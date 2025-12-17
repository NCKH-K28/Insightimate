import { z } from 'zod';
import { isoDateString, isoString } from '../common';

export const ZIssueField = z.object({
  id: z.string(),
  name: z.string(),
  sequence: z.number(),
  description: z.string().nullish(),
  iconURL: z.string().nullish(),
  color: z.string().nullish(),
  projectId: z.string(),
});

export const statusCategoryEnum = ['TODO', 'IN_PROGRESS', 'DONE'] as const;
export const statusCategorySchema = z.enum(statusCategoryEnum);

export const ZIssueStatus = ZIssueField.extend({ category: statusCategorySchema });
export const ZIssueType = ZIssueField.extend({ hierarchy: z.number() });
export const ZIssuePriority = ZIssueField;
export const ZIssueResolution = ZIssueField;

export const ZstoryPoints = z.number().min(0);
export const ZIssue = z.object({
  id: z.string(),
  key: z.string(),
  summary: z.string(),
  description: z.string().nullable(),
  projectId: z.string(),
  parentId: z.string().nullish(),
  typeId: ZIssueType.shape.id,
  statusId: ZIssueStatus.shape.id,
  priorityId: ZIssuePriority.shape.id,
  resolutionId: ZIssueResolution.shape.id.nullish(),
  reporterId: z.string().nullable(), // FIXME: should be required
  assigneeId: z.string().nullable(),

  dueDate: isoDateString.nullable(),
  startDate: isoDateString.nullable(),
  resolvedAt: isoDateString.nullable(),

  createdAt: isoString,
  updatedAt: isoString,

  storyPoints: ZstoryPoints.nullish(),
  // extend
  // rank: z.number().nullish(),
  // boardId: z.string().nullish(),
  // sprintId: z.string().nullish(),
  // planId: z.string().nullish(),
});

export type IssueField = z.infer<typeof ZIssueField>;
export type IssueStatus = z.infer<typeof ZIssueStatus>;
export type IssuePriority = z.infer<typeof ZIssuePriority>;
export type IssueType = z.infer<typeof ZIssueType>;
export type IssueResolution = z.infer<typeof ZIssueResolution>;
export type StoryPoints = z.infer<typeof ZstoryPoints>;
export type Issue = z.infer<typeof ZIssue>;
