import { z } from 'zod';

export const IssueTypeConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  hierarchy: z.number(),
});
export type IssueTypeConfig = z.infer<typeof IssueTypeConfigSchema>;

export const StatusConfigSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
});

export const PriorityConfigSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
});

export const ProjectDraftSchema = z.object({
  issueTypes: z.array(IssueTypeConfigSchema),
  statuses: z.array(StatusConfigSchema),
  priorities: z.array(PriorityConfigSchema),
  defaultStatusId: z.union([z.string(), z.number()]),
  defaultPriorityId: z.union([z.string(), z.number()]),
});
export type ProjectDraft = z.infer<typeof ProjectDraftSchema>;

// Internal Plan Model
// We need an interface for the recursive type
export type PlanNode = {
  typeId: string;
  summary: string;
  description: string;
  storyPoints: number | null;
  children: PlanNode[];
};

const nodeBase = {
  typeId: z.string(),
  summary: z.string(),
  description: z.string(),
  storyPoints: z.number().nullable(),
};

// Unroll recursion to fixed depth (6) to satisfy Gemini API constraints (no $ref/$defs)
const NodeL0 = z.object({ ...nodeBase, children: z.array(z.any()).default([]) });
const NodeL1 = z.object({ ...nodeBase, children: z.array(NodeL0) });
const NodeL2 = z.object({ ...nodeBase, children: z.array(NodeL1) });
const NodeL3 = z.object({ ...nodeBase, children: z.array(NodeL2) });
const NodeL4 = z.object({ ...nodeBase, children: z.array(NodeL3) });
const NodeL5 = z.object({ ...nodeBase, children: z.array(NodeL4) });
const NodeL6 = z.object({ ...nodeBase, children: z.array(NodeL5) });

export const PlanNodeSchema: z.ZodType<PlanNode> = NodeL6 as unknown as z.ZodType<PlanNode>;

export const PlanTreeSchema = z.object({
  root: z.array(PlanNodeSchema),
});
export type PlanTree = z.infer<typeof PlanTreeSchema>;

// Final Issue Model
export const IssueSchema = z.object({
  id: z.string(),
  parentId: z.string().nullable(),
  type: IssueTypeConfigSchema,
  typeId: z.union([z.string(), z.number()]),
  summary: z.string(),
  description: z.string(),
  storyPoints: z.number().nullable(),
  statusId: z.union([z.string(), z.number()]),
  priorityId: z.union([z.string(), z.number()]),
});
export type Issue = z.infer<typeof IssueSchema>;

export const GenerateRequestSchema = z.object({
  prompt: z.string(),
  contexts: ProjectDraftSchema,
});
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

export const GenerateResponseSchema = z.object({
  issues: z.array(IssueSchema),
});
export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
});
