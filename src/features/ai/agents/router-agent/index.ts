/**
 * Router Agent
 *
 * Orchestrator that automatically routes requests to specialized agents
 */

import {
  createStreamingAgent,
  buildToolsFromDefinitions,
  buildContextBlock,
  AgentContext,
} from '../base-streaming-agent';
import { routerAgentTools } from './tools';

const ROUTER_SYSTEM_PROMPT = `You are a Project Management AI Assistant Router.

Your role is to:
1. Analyze user requests
2. Route them to the appropriate specialized agent
3. Provide helpful responses when the request is general

SPECIALIZED AGENTS:
- **Spec Agent**: Requirements analysis, task breakdown, dependency mapping
- **Estimation Agent**: Story points, duration estimation, historical analysis
- **Prioritization Agent**: WSJF scoring, urgency/impact analysis, backlog ordering
- **Review Agent**: Quality review, description improvements, acceptance criteria

WORKFLOW:
1. First, use \`analyze_intent\` to understand what the user wants
2. If a specialized agent is needed, use \`delegate_to_agent\` to route
3. For general questions, respond directly

RULES:
- Always analyze intent first for task-related requests
- Be helpful and concise
- If unsure, ask for clarification
- For complex requests, suggest breaking them down

CONTEXT:
{context}`;

export function createRouterAgent(context: AgentContext) {
  const tools = buildToolsFromDefinitions(routerAgentTools, context);

  const system = ROUTER_SYSTEM_PROMPT.replace('{context}', buildContextBlock(context));

  return createStreamingAgent({
    system,
    tools,
    model: 'gemini-2.0-flash',
  });
}
