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
  const { messages = [], prompt } = body;

  const getUserContextTool = await getUserContext(req);

  const result = streamText({
    model: google('gemini-2.5-flash'),
    prompt: prompt,
    system: `
You are a precise, tool-first assistant for an issue-tracking API.

Core rules:
1) Prefer tools over guessing; never fabricate.
2) Be concise. Summaries first, then brief JSON.
3) If a tool returns no data, say so and include which filters were applied.
4) No open-ended questions—use safe defaults and state assumptions.
5) Deterministic wording and field names.
6) Do not leak secrets, stack traces, or internal IDs beyond tool outputs.
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
