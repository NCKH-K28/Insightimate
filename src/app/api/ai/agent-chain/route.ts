/**
 * Agent Chain API Route
 *
 * Allows chaining multiple agents with streaming output
 *
 * POST /api/ai/agent-chain
 * Body: {
 *   workspaceId: string,
 *   agents: ('spec' | 'estimation' | 'prioritization' | 'review')[],
 *   messages: UIMessage[]
 * }
 */

import { z } from 'zod';
import { middlewareHandler } from '@/lib/http/api-handler.v2';
import { authenticated, getAuthFromRequest } from '@/lib/auth/authn';
import { createAgentUIStreamResponse } from 'ai';
import {
  createSpecAgent,
  createEstimationAgent,
  createPrioritizationAgent,
  createReviewAgent,
  AgentContext,
} from '@/features/ai/agents';

// ===== Input Schema =====

const ZAgentType = z.enum(['spec', 'estimation', 'prioritization', 'review']);

const ZAgentChainInput = z.object({
  workspaceId: z.string().min(1),
  projectId: z.string().optional(),
  sprintId: z.string().optional(),
  agents: z.array(ZAgentType).min(1).max(4),
});

// ===== Agent Factory Map =====

const agentFactories = {
  spec: createSpecAgent,
  estimation: createEstimationAgent,
  prioritization: createPrioritizationAgent,
  review: createReviewAgent,
} as const;

// ===== Route Handler =====

export const POST = middlewareHandler([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const { messages, ...body } = await req.json();
  const input = ZAgentChainInput.parse(body);

  // Build context
  const context: AgentContext = {
    workspaceId: input.workspaceId,
    actorId,
    projectId: input.projectId,
    sprintId: input.sprintId,
    locale: 'vi-VN', // TODO: Get from request headers
  };

  // For single agent, use directly
  if (input.agents.length === 1) {
    const agentType = input.agents[0];
    const createAgent = agentFactories[agentType];
    const agent = createAgent(context);

    return createAgentUIStreamResponse({
      agent,
      uiMessages: messages,
      abortSignal: req.signal,
    });
  }

  // For multiple agents, run the first one
  // TODO: Implement proper chaining with context passing
  const firstAgentType = input.agents[0];
  const createAgent = agentFactories[firstAgentType];
  const agent = createAgent(context);

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
    abortSignal: req.signal,
  });
});
