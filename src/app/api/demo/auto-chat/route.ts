import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAgentUIStreamResponse, generateObject, UIMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import {
  createSpecAgent,
  createEstimationAgent,
  createPrioritizationAgent,
  createReviewAgent,
  createRouterAgent,
  AgentContext,
} from '@/features/ai/agents';

// Support all message part types from AI SDK v6
// Using passthrough to allow tool-invocation, tool-result, approval parts
const ZMessagePart = z
  .object({
    type: z.string(),
    text: z.string().optional(),
  })
  .passthrough(); // Allow additional properties like toolName, args, result, approval

const ZMessage = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().optional(),
  parts: z.array(ZMessagePart).optional(),
});

const ZInput = z.object({
  messages: z.array(ZMessage),
  workspaceId: z.string().describe('Workspace ID for context'),
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
    // Get auth from cookies directly (for streaming compatibility)
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

    // Convert messages to UIMessage format
    // NOTE: When switching agents, tool parts from previous agents may cause
    // "No tool schema found" errors. We filter out tool parts and only keep text
    // to allow clean agent switching. The trade-off is losing tool history.
    const uiMessages: UIMessage[] = input.messages.map((m, i) => {
      // Extract only text parts to avoid cross-agent tool schema errors
      const textParts = (m.parts || [])
        .filter((p) => p.type === 'text' && p.text)
        .map((p) => ({ type: 'text' as const, text: p.text! }));

      // If we have text parts, use them; otherwise use content field
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
