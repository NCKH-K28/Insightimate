import z from 'zod';
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
import { IssueGenTool } from '@/features/agents/server/tools/issue-gen-tool.v2';
import { pmSearchTool, webSearch } from '@/features/agents/server/tools';

const genIssue = IssueGenTool();

export const POST = middlewareHandler([authenticated], async (req) => {
  // const auth = await getAuthFromRequest(req);

  const body = await req.json();
  const { messages = [], agentId } = body;
  if (!agentId) throw new Error('agentId is required');

  const stream = createUIMessageStream({
    async execute({ writer }) {
      const result = streamText({
        model: google('gemini-2.5-flash'),
        messages: convertToModelMessages(messages.slice(-8)),
        tools: {
          genIssueTool: genIssue,
          webSearch,
          pmSearchTool,
        },
        stopWhen: stepCountIs(50),
      });

      writer.merge(result.toUIMessageStream({ sendFinish: false }));
      await result.consumeStream();
    },
  });

  return createUIMessageStreamResponse({ stream });
});
