/**
 * Demo Agent Chat - No Auth Required (Development only)
 *
 * POST /api/demo/agent-chat
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAgentUIStreamResponse } from 'ai';
import {
  createSpecAgent,
  createEstimationAgent,
  createPrioritizationAgent,
  createReviewAgent,
  AgentContext,
} from '@/features/ai/agents';

const ZAgentType = z.enum(['spec', 'estimation', 'prioritization', 'review']);

const ZInput = z.object({
  agents: z.array(ZAgentType).min(1).max(4),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    }),
  ),
});

const agentFactories = {
  spec: createSpecAgent,
  estimation: createEstimationAgent,
  prioritization: createPrioritizationAgent,
  review: createReviewAgent,
} as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = ZInput.parse(body);

    // Demo context - using real user ID for database access
    const context: AgentContext = {
      workspaceId: 'demo-workspace',
      actorId: 'user_yhoogji042ko1rtc7ddpk9mw',
      locale: 'vi-VN',
    };

    // Use first agent
    const agentType = input.agents[0];
    const createAgent = agentFactories[agentType];
    const agent = createAgent(context);

    // Convert messages to UIMessage format
    const uiMessages = input.messages.map((m, i) => ({
      id: `msg-${i}`,
      role: m.role as 'user' | 'assistant',
      parts: [{ type: 'text' as const, text: m.content }],
    }));

    return createAgentUIStreamResponse({
      agent,
      uiMessages,
      abortSignal: req.signal,
    });
  } catch (error) {
    console.error('Agent chat error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 },
    );
  }
}
