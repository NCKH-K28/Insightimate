import z from 'zod';

export const ZAgentSourceCreate = z.object({
  sourceType: z.enum(['PROJECT']),
  sourceId: z.string(),
  agentId: z.string(),
});

export const ZAgentCreate = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  workspaceId: z.string(),
  sources: z.array(ZAgentSourceCreate).optional(),
});

export type AgentCreateInput = z.infer<typeof ZAgentCreate>;
export type AgentSourceCreateInput = z.infer<typeof ZAgentSourceCreate>;
