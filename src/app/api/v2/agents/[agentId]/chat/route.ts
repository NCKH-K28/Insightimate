import z from 'zod';
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
import { authenticated } from '@/lib/auth';
import { pmSearchTool, webSearch } from '@/features/agents/server/tools';
import { issueGenerator } from '@/features/agents/server/cqrs/c-issue-genarator';

function issuesToMarkdown(
  issues: Array<{
    id: string;
    summary: string;
    description: string | null;
    story_points: number | null;
    parent_id?: string | null;
    due_date: string | null;
    priority: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  }>,
): string {
  const columnMap = {
    id: 'ID',
    parent_id: 'Parent',
    summary: 'Summary',
    description: 'Description',
    story_points: 'SP',
    priority: 'Priority',
    due_date: 'Due date',
  };

  const header =
    Object.values(columnMap)
      .map((col) => `| ${col} `)
      .join('') + '|';

  const separator =
    Object.values(columnMap)
      .map(() => '| --- ')
      .join('') + '|';
  const rows = issues
    .map((issue) => {
      return (
        Object.keys(columnMap)
          .map((key) => {
            let value = (issue as any)[key];
            if (value === null || value === undefined) {
              value = '';
            } else if (key === 'due_date' && value) {
              value = new Date(value).toISOString().split('T')[0];
            }
            return `| ${value} `;
          })
          .join('') + '|'
      );
    })
    .join('\n');

  return `${header}\n${separator}\n${rows}`;
}

export const POST = middlewareHandler([authenticated], async (req) => {
  // const auth = await getAuthFromRequest(req);

  const issueGeneratorTool = tool({
    name: 'issue_generator',
    description: 'Generates issues based on the project description and requirements.',
    inputSchema: z.object({
      feature: z.string().describe('A description of the feature to create issues for'),
    }),
    outputSchema: z.object({
      markdown: z.string().describe('Generated issues in markdown table format'),
    }),
    execute: async (input) => {
      try {
        const result = await issueGenerator({ text: input.feature }, { actorId: 'system' });
        const issuesMarkdown = issuesToMarkdown(result.data);
        return { markdown: issuesMarkdown };
      } catch (error) {
        console.error('Error in issue_generator tool:', error);
        throw error;
      }
    },
  });

  const body = await req.json();
  const { messages = [], agentId } = body;
  if (!agentId) throw new Error('agentId is required');

  const stream = createUIMessageStream({
    async execute({ writer }) {
      const result = streamText({
        model: google('gemini-2.5-flash'),
        system: `
        'issueGeneratorTool' return table in markdown format
        `.trim(),
        messages: convertToModelMessages(messages.slice(-8)),
        tools: {
          webSearch,
          pmSearchTool,
          issueGeneratorTool,
        },
        stopWhen: stepCountIs(50),
      });

      writer.merge(result.toUIMessageStream({ sendFinish: false }));
      await result.consumeStream();
    },
  });

  return createUIMessageStreamResponse({ stream });
});
