/**
 * Demo Agent Chat - Cookie Auth Required
 *
 * POST /api/demo/agent-chat
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAgentUIStreamResponse } from 'ai';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/authn/session';
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
  workspaceId: z.string().describe('Workspace ID for context'),
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
    // Get auth from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.sub) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const input = ZInput.parse(body);

    // Real context from authenticated user
    const context: AgentContext = {
      workspaceId: input.workspaceId,
      actorId: payload.sub,
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
