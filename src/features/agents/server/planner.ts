import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { toolRegistry } from './registry';
import { ZAgentPlan, AgentPlan } from './types';

export class Planner {
  constructor(private modelName: string = 'gemini-2.0-flash') {}

  async plan(goal: string, history: any[] = []): Promise<AgentPlan> {
    const tools = toolRegistry.list();
    const toolDescriptions = tools.map((t) => `- ${t.name}: ${t.description}`).join('\n');

    const prompt = `
You are an expert Planner for a Project Management AI Assistant.
Your goal is to break down the user's request into a sequence of tool calls.

Available Tools:
${toolDescriptions}

Rules:
1. ONLY use available tools.
2. If the user asks a simple question that can be answered with one tool, plan that one step.
3. If the user asks a complex question (e.g., "Summarize high priority bugs"), plan the necessary steps (e.g., list_issues with filter -> summarize).
4. If you cannot answer, or need to ask the user, explain why in the 'finalThought'.

User Request: "${goal}"
`;

    const { object } = await generateObject({
      model: google(this.modelName),
      schema: ZAgentPlan,
      system: 'You are a precise planner. Output JSON only.',
      prompt,
    });

    return object;
  }
}
