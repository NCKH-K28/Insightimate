// Schema for Issue Generation Agent
import { z } from 'zod';

const ZIsoDate = z.iso.date();

//
const ZTypeHierarchy = z.union([z.literal(1), z.literal(0), z.literal(-1)]);

export const ZIssueGenSchema = z.object({
  id: z.string().min(1, 'Issue ID is required, e.g., PROJ-123'),
  summary: z.string().min(1, 'Issue summary is required'),
  description: z.string().optional(),
  dueDate: ZIsoDate.optional(),
  priority: z.number().min(1).max(5).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  type: z.object({
    name: z.string().min(1, 'Type name is required'),
    hierarchy: ZTypeHierarchy,
  }),
  parentId: z.string().min(1).optional(),
});

export const ZIssueGenInputSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  context: z.string().optional(),
});

export const ZIssueGenOutputSchema = z.object({ data: z.array(ZIssueGenSchema) });

export type IssueGen = z.infer<typeof ZIssueGenSchema>;
