import { z } from 'zod';

// --- Schema cho Spec Writer ---
export const TaskSchema = z.object({
  title: z.string(),
  type: z.enum(['Frontend', 'Backend', 'Database', 'DevOps']),
  description: z.string(),
  acceptanceCriteria: z.array(z.string()),
  techNotes: z.string().optional(),
  priority: z.enum(['High', 'Medium', 'Low']),
  storyPoints: z.number(),
});

export const ProjectPlanSchema = z.object({
  summary: z.string().describe('Tóm tắt chiến lược'),
  tasks: z.array(TaskSchema),
});

// --- Schema cho Router ---
export const RouteDecisionSchema = z.object({
  destination: z.enum(['spec_writer', 'project_qa', 'backlog_groomer']),
  reason: z.string().describe('Lý do chọn agent này'),
  context: z
    .string()
    .optional()
    .describe('Thông tin quan trọng cần chuyển tiếp (VD: Task ID, từ khóa)'),
});
