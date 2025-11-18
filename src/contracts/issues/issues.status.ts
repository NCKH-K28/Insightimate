import { z } from 'zod';

export const IssueStatusCategoryEnum = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);

export const ZIssueStatus = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  iconURL: z.string().optional(),
  color: z.string().optional(),
  category: IssueStatusCategoryEnum,
  sequence: z.number().optional(),
  projectId: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const ZIssueStatusCreateInput = ZIssueStatus.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const ZIssueStatusUpdateInput = ZIssueStatusCreateInput.partial();

export type IssueStatusCategory = z.infer<typeof IssueStatusCategoryEnum>;
export type IssueStatusCreateInput = z.infer<typeof ZIssueStatusCreateInput>;
export type IssueStatusUpdateInput = z.infer<typeof ZIssueStatusUpdateInput>;
