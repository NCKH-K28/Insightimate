import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from 'ai';
import { google } from '@ai-sdk/google';
import { middlewareHandler } from '@/lib/http/api-handler.v2';
import { authenticated } from '@/lib/auth';
import { getTimeTool, getUserContext, listIssuesTool } from './server/tools';
import { seed } from './server/issue-seed';

// ==== Route ====
export const POST = middlewareHandler([authenticated], async (req) => {
  await seed();

  const body = await req.json();
  const { messages = [], agentId } = body;
  if (!agentId) throw new Error('agentId is required');

  const getUserContextTool = await getUserContext(req);

  const result = streamText({
    model: google('gemini-2.5-flash'),
    system: `
You are an AI assistant for an issue tracking system. Your primary role is to help users manage and analyze their issues efficiently.

## Core Principles
1. **Tool-first approach**: Always use available tools to fetch real data instead of making assumptions
2. **Accuracy over speed**: If unsure, use tools to verify information
3. **Concise communication**: Provide clear, actionable responses without unnecessary verbosity
4. **Data transparency**: When tools return empty results, explicitly state what filters were applied

## Response Guidelines
- Start with a brief summary, then provide relevant details
- Use markdown formatting for better readability (headers, lists, code blocks)
- When referencing issues, use format: [[issue:id|title]] for clickable links
- State your assumptions clearly when using default values
- Never fabricate data or internal system details
- Limit tool calls to 10 maximum to maintain performance

## Available Tools
- **listIssuesTool**: Query and filter issues by various criteria
- **getTimeTool**: Get current time and date information
- **getUserContextTool**: Access user-specific context and preferences

## Security
- Never expose internal system details, stack traces, or sensitive IDs
- Only return information available through official tool outputs
`.trim(),
    messages: convertToModelMessages(messages),
    tools: { listIssuesTool, getTimeTool, getUserContextTool },
    stopWhen: stepCountIs(10),
  });

  const stream = createUIMessageStream({
    execute({ writer }) {
      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
});
