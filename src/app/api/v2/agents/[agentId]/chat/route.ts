import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  tool,
} from 'ai';
import { google } from '@ai-sdk/google';
import { middlewareHandler } from '@/lib/http/api-handler.v2';
import { authenticated, getAuthFromRequest } from '@/lib/auth';
import z from 'zod';
import { IssueGenTool } from '@/features/agents/server/tools/issue-gen-tool';
import { RootSchema, serper } from '@/lib/serper';
import { ZSearchInput, ZSearchOutput } from '@/features/query/search.schema';
import { queryService } from '@/features/query/service';

const searchTool = tool({
  name: 'pmSearch',
  description:
    'Search your project management knowledge base for relevant information about issues, projects, sprints',
  inputSchema: ZSearchInput,
  outputSchema: ZSearchOutput,
  execute: (input) => queryService.search(input, { actorId: 'system' }),
});
// ==== Route ====
export const POST = middlewareHandler([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);

  const body = await req.json();
  const { messages = [], agentId } = body;
  if (!agentId) throw new Error('agentId is required');

  const stream = createUIMessageStream({
    async execute({ writer }) {
      const result = streamText({
        model: google('gemini-2.5-flash'),
        messages: convertToModelMessages(messages.slice(-8)),
        tools: {
          genIssue: IssueGenTool,
          webSearch: tool({
            name: 'webSearch',
            description: 'Search the web for relevant information.',
            inputSchema: z.object({
              q: z.string().describe('The search query.'),
              page: z
                .number()
                .optional()
                .describe('The page number for paginated results, default is 1.'),
            }),
            outputSchema: RootSchema,
            execute: (input) => serper.search(input),
          }),
          pmSearch: searchTool,
        },
        stopWhen: stepCountIs(50),
      });

      writer.merge(result.toUIMessageStream({ sendFinish: false }));
      await result.consumeStream();
    },
  });

  return createUIMessageStreamResponse({ stream });
});
