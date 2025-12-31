import { z } from 'zod';

const IssueStatusCategoryEnum = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);

const ZIssueStatus = z.object({
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

const ZIssueStatusCreateInput = ZIssueStatus.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
const ZIssueStatusUpdateInput = ZIssueStatusCreateInput.partial();

export type IssueStatusCategory = z.infer<typeof IssueStatusCategoryEnum>;
type IssueStatusCreateInput = z.infer<typeof ZIssueStatusCreateInput>;
type IssueStatusUpdateInput = z.infer<typeof ZIssueStatusUpdateInput>;
