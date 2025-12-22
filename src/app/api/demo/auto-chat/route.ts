/**
 * Demo Auto-Router Agent Chat
 *
 * POST /api/demo/auto-chat
 *
 * Automatically routes user requests to the appropriate agent based on intent.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAgentUIStreamResponse, generateObject, UIMessage } from 'ai';
import { google } from '@ai-sdk/google';
import {
  createSpecAgent,
  createEstimationAgent,
  createPrioritizationAgent,
  createReviewAgent,
  createRouterAgent,
  AgentContext,
} from '@/features/ai/agents';

// Support both content (simple) and parts (AI SDK v6) formats
const ZMessagePart = z.object({
  type: z.string(),
  text: z.string().optional(),
});

const ZMessage = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().optional(),
  parts: z.array(ZMessagePart).optional(),
});

const ZInput = z.object({
  messages: z.array(ZMessage),
  autoRoute: z.boolean().default(true).describe('Auto-select agent based on intent'),
  agents: z.array(z.string()).optional(),
});

const ZRouteDecision = z.object({
  agent: z.enum(['spec', 'estimation', 'prioritization', 'review', 'router']),
  confidence: z.enum(['high', 'medium', 'low']),
  reasoning: z.string(),
});

const agentFactories = {
  spec: createSpecAgent,
  estimation: createEstimationAgent,
  prioritization: createPrioritizationAgent,
  review: createReviewAgent,
  router: createRouterAgent,
} as const;

// Extract text content from message (handles both formats)
function getMessageText(message: z.infer<typeof ZMessage>): string {
  if (message.content) return message.content;
  if (message.parts) {
    return message.parts
      .filter((p) => p.type === 'text' && p.text)
      .map((p) => p.text)
      .join('\n');
  }
  return '';
}

async function classifyIntent(message: string): Promise<z.infer<typeof ZRouteDecision>> {
  const { object } = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: ZRouteDecision,
    messages: [
      {
        role: 'system',
        content: `You are an intent classifier for a project management AI.

AGENTS:
- spec: Requirements analysis, task breakdown, dependencies. Keywords: "analyze", "break down", "subtasks", "dependencies", "phân tích", "phân rã"
- estimation: Story points, duration, effort. Keywords: "estimate", "points", "how long", "effort", "ước tính", "bao lâu"
- prioritization: Priority, urgency, impact, WSJF, backlog. Keywords: "prioritize", "urgent", "important", "order", "ưu tiên", "sắp xếp"
- review: Quality review, descriptions, acceptance criteria. Keywords: "review", "improve", "quality", "check", "kiểm tra", "đánh giá"
- router: General questions, unclear requests, multi-agent tasks

Choose the most appropriate agent.`,
      },
      {
        role: 'user',
        content: `Classify this request: "${message}"`,
      },
    ],
  });

  return object;
}

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

    // Get the last user message for intent classification
    const lastUserMessage = input.messages.filter((m) => m.role === 'user').pop();
    const lastMessageText = lastUserMessage ? getMessageText(lastUserMessage) : '';

    let agentType: keyof typeof agentFactories = 'router';

    // Check if specific agent is requested
    if (input.agents?.length) {
      const requestedAgent = input.agents[0] as keyof typeof agentFactories;
      if (requestedAgent in agentFactories) {
        agentType = requestedAgent;
        console.log(`[Agent-Chat] Using requested agent: ${agentType}`);
      }
    } else if (input.autoRoute && lastMessageText) {
      // Classify intent and select agent
      const decision = await classifyIntent(lastMessageText);
      agentType = decision.agent;
      console.log(
        `[Auto-Router] Selected: ${agentType} (${decision.confidence}) - ${decision.reasoning}`,
      );
    }

    // Create and run the selected agent
    const createAgent = agentFactories[agentType];
    const agent = createAgent(context);

    // Convert messages to UIMessage format - filter out tool/step parts that cause validation errors
    const uiMessages: UIMessage[] = input.messages.map((m, i) => {
      // Filter parts to only keep text type (AI SDK v6 requires standard types or data-* prefix)
      const textParts = (m.parts || [])
        .filter((p) => p.type === 'text' && p.text)
        .map((p) => ({ type: 'text' as const, text: p.text! }));

      // If no text parts, use content field
      const parts =
        textParts.length > 0 ? textParts : [{ type: 'text' as const, text: m.content || '' }];

      return {
        id: m.id || `msg-${i}`,
        role: m.role as 'user' | 'assistant',
        parts,
      };
    });

    return createAgentUIStreamResponse({
      agent,
      uiMessages,
      abortSignal: req.signal,
    });
  } catch (error) {
    console.error('Auto-router error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 },
    );
  }
}
