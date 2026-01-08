import { z } from 'zod';

export interface AgentContext {
  workspaceId: string;
  userId: string;
  runId: string;
}

export interface AgentTool<TInput = any, TOutput = any> {
  name: string;
  description: string;
  schema: z.ZodType<TInput>;
  execute: (input: TInput, context: AgentContext) => Promise<TOutput>;
}

export const ZPlanStep = z.object({
  thought: z.string().describe('Reasoning for this step'),
  toolName: z.string().describe('The tool to call'),
  toolInput: z.record(z.string(), z.any()).describe('The arguments for the tool'),
});

export type PlanStep = z.infer<typeof ZPlanStep>;

export const ZAgentPlan = z.object({
  steps: z.array(ZPlanStep).describe('The sequence of steps to execute'),
  finalThought: z.string().optional().describe('Final reasoning if no more steps needed'),
});

export type AgentPlan = z.infer<typeof ZAgentPlan>;
