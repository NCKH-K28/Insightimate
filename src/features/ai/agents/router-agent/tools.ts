/**
 * Router Agent
 *
 * Automatically routes user requests to the appropriate specialized agent
 * based on intent classification.
 */

import { z } from 'zod';
import { AgentToolDefinition, AgentContext, buildContextBlock } from '../base-streaming-agent';
import { llmAnalyze } from '../utils/llm-analyze';
import {
  getIssue,
  patchIssues,
  ZGetIssueInput,
  ZPatchIssueInput,
} from '../../insightmate/services/issues';
import { getProject, ZGetProjectInput } from '../../insightmate/services/project';
import { search } from '@/features/query/server/cqrs/q-search-v2';
import { ZQueryOutput, ZQueryParams } from '@/contracts/query/schema-v2';
import { TavilySearch } from '@langchain/tavily';

// Initialize Tavily for web search (requires TAVILY_API_KEY env)
const tavily = new TavilySearch({ maxResults: 5, topic: 'general' });

// Web search schema
const ZWebSearchInput = z.object({
  query: z.string().min(3).describe('Search query for web search'),
});

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

// ===== Issue Management Tools =====

export const getIssueTool: AgentToolDefinition<typeof ZGetIssueInput> = {
  name: 'get_issue',
  description:
    'Get issue details by ID or key (e.g., GYM-8). Use to fetch issue info before updating.',
  inputSchema: ZGetIssueInput,
  execute: async (input, context) => {
    return getIssue(input, { actorId: context.actorId });
  },
};

export const getProjectTool: AgentToolDefinition<typeof ZGetProjectInput> = {
  name: 'get_project',
  description: 'Get project details including available statuses, types, and priorities.',
  inputSchema: ZGetProjectInput,
  execute: async (input, context) => {
    return getProject(input, { actorId: context.actorId });
  },
};

export const patchIssuesTool: AgentToolDefinition<typeof ZPatchIssueInput> = {
  name: 'patch_issues',
  description:
    'Create, update, or delete issues. Use for status changes, field updates. Requires approval.',
  inputSchema: ZPatchIssueInput,
  needsApproval: true,
  execute: async (input, context) => {
    await patchIssues(input, { actorId: context.actorId });
    return {
      success: true,
      creates: input.creates?.length || 0,
      updates: input.updates?.length || 0,
      deletes: input.deletes?.length || 0,
    };
  },
};

export const searchTool: AgentToolDefinition<typeof ZQueryParams> = {
  name: 'search',
  description:
    'Full-text search for issues, projects, sprints, users. Use when user wants to find something.',
  inputSchema: ZQueryParams,
  execute: async (input, context) => {
    return search(input, { actorId: context.actorId });
  },
};

export const webSearchTool: AgentToolDefinition<typeof ZWebSearchInput> = {
  name: 'web_search',
  description:
    'Search the web for documentation, APIs, external info. Use for tech research or external resources.',
  inputSchema: ZWebSearchInput,
  execute: async (input, _context) => {
    const results = await tavily.invoke({ query: input.query });
    return results;
  },
};

// ===== All Router Agent Tools =====

export const routerAgentTools = [
  routeDecisionTool,
  delegateToAgentTool,
  getIssueTool,
  getProjectTool,
  patchIssuesTool,
  searchTool,
  webSearchTool,
];
