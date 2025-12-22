/**
 * Router Agent
 *
 * Automatically routes user requests to the appropriate specialized agent
 * based on intent classification.
 */

import { z } from 'zod';
import { AgentToolDefinition, AgentContext, buildContextBlock } from '../base-streaming-agent';
import { llmAnalyze } from '../utils/llm-analyze';

// ===== Schemas =====

export const ZRouteDecisionInput = z.object({
  message: z.string().describe('User message to analyze'),
});

export const ZRouteDecisionOutput = z.object({
  primaryAgent: z
    .enum(['spec', 'estimation', 'prioritization', 'review', 'general'])
    .describe('Primary agent to handle this request'),
  secondaryAgents: z
    .array(z.enum(['spec', 'estimation', 'prioritization', 'review']))
    .describe('Additional agents that might be helpful'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Confidence in routing decision'),
  reasoning: z.string().describe('Why this agent was chosen'),
  detectedIntent: z.string().describe('What the user wants to accomplish'),
});

export const ZDelegateToAgentInput = z.object({
  agent: z
    .enum(['spec', 'estimation', 'prioritization', 'review'])
    .describe('Agent to delegate to'),
  task: z.string().describe('Specific task description for the agent'),
  issueId: z.string().optional().describe('Issue ID if relevant'),
  projectId: z.string().optional().describe('Project ID if relevant'),
});

// ===== Tool Definitions =====

export const routeDecisionTool: AgentToolDefinition<typeof ZRouteDecisionInput> = {
  name: 'analyze_intent',
  description: 'Analyze user message to determine which specialized agent should handle it.',
  inputSchema: ZRouteDecisionInput,
  execute: async (input, context) => {
    const result = await llmAnalyze({
      schema: ZRouteDecisionOutput,
      systemContext: `You are an AI request router. Classify user requests to the appropriate agent.

AVAILABLE AGENTS:
- spec: Requirements analysis, task breakdown, dependencies. Use for: "analyze this requirement", "break down task", "what are the subtasks"
- estimation: Story points, duration, historical analysis. Use for: "estimate this", "how long will it take", "story points"
- prioritization: WSJF, urgency, impact, backlog ordering. Use for: "prioritize", "which is more important", "order backlog"
- review: Quality review, descriptions, acceptance criteria. Use for: "review this task", "improve description", "check quality"
- general: Chitchat, questions about the system, unclear requests`,
      prompt: `Classify this user request:

"${input.message}"

Determine:
1. Which agent should primarily handle this?
2. Are there secondary agents that could help?
3. How confident are you in this routing?
4. What is the user's intent?`,
    });

    return result;
  },
};

export const delegateToAgentTool: AgentToolDefinition<typeof ZDelegateToAgentInput> = {
  name: 'delegate_to_agent',
  description: 'Delegate a specific task to a specialized agent. Use after analyzing intent.',
  inputSchema: ZDelegateToAgentInput,
  execute: async (input, context) => {
    // This is a "marker" tool - the actual delegation happens in the API route
    // by switching to the appropriate agent
    return {
      delegated: true,
      agent: input.agent,
      task: input.task,
      message: `Task delegated to ${input.agent} agent: ${input.task}`,
    };
  },
};

// ===== All Router Agent Tools =====

export const routerAgentTools = [routeDecisionTool, delegateToAgentTool];
