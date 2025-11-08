import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  UIDataTypes,
  UIMessage,
  UIMessageStreamWriter,
  UITools,
} from 'ai';
import z from 'zod';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import {
  listSources,
  sourceService,
  ZSourceListInput,
} from '@/features/agents/server/services/source.service';
import {
  ZProjectListInput,
  listProjects,
  ZBoardListInput,
  listBoards,
  ZSprintListInput,
  listSprints,
  ZStatusListInput,
  listStatuses,
  ZRoleListInput,
  listProjectRoles,
  listIssues,
  ZListIssuesInput,
} from '@/features/agents/server/cqrs';
import { google } from '@ai-sdk/google';

export const getTimeTool = tool({
  name: 'getTime',
  description: 'Get the current time in a specified timezone.',
  inputSchema: z.object({
    timezone: z.string().optional().describe('IANA timezone, e.g. "America/New_York".'),
  }),
  outputSchema: z
    .object({ timezone: z.string(), currentTime: z.string() })
    .describe('Current time info.'),
  execute: async (input: { timezone?: string }) => {
    const tz = input.timezone || 'UTC';
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: tz,
    };
    const now = new Intl.DateTimeFormat('en-US', options).format(new Date());
    return { timezone: tz, currentTime: now };
  },
});

export const getUserContext = async (req: NextRequest) => {
  const auth = await getAuthFromRequest(req);
  const userId = auth.user.id;
  return tool({
    name: 'getUserContext',
    description: 'Get the current user context including id, name, email, and timezone.',
    inputSchema: z.object({}),
    outputSchema: z.any().describe('User context object.'),
    execute: async () => {
      const user = await prisma.user.findUnique({
        where: { id: 'user-1' },
        select: { id: true, name: true, email: true },
      });
      if (!user) throw new Error('User not found');
      return user;
    },
  });
};

type Writer = UIMessageStreamWriter<UIMessage<unknown, UIDataTypes, UITools>>;

export const createPmSearch = (
  messages: UIMessage<unknown, UIDataTypes, UITools>[],
  writer: Writer,
  { actorId }: { actorId: string },
) =>
  tool({
    name: 'pmSearch',
    description: `Project management search tool to retrieve user, project, board, sprint, issue, source, status, and role information.`,
    inputSchema: z.any().describe('No input required.'),
    async execute() {
      const sub = streamText({
        model: google('gemini-2.5-flash'),
        system: `You are a project management AI assistant. Use the available tools to answer user queries. Always respond in JSON format with an "answer" field and, if applicable, a "data" field containing results from tool calls.`,
        messages: convertToModelMessages(messages.slice(-8)),
        tools: {
          getCurrentTime: tool({
            name: 'getCurrentTime',
            description: 'Get the current date and time in ISO 8601 format.',
            inputSchema: z.any().describe('No input required.'),
            async execute() {
              return new Date().toISOString();
            },
          }),
          listProjects: tool({
            name: 'listProjects',
            description: `List projects the user has access to.`,
            inputSchema: ZProjectListInput,
            execute: (input) => listProjects(input),
          }),
          listBoards: tool({
            name: 'listBoards',
            description: `List boards the user has access to.`,
            inputSchema: ZBoardListInput,
            execute: (input) => listBoards(input, { actorId }),
          }),
          listSprints: tool({
            name: 'listSprints',
            description: `List sprints by board IDs and status.`,
            inputSchema: ZSprintListInput,
            execute: (input) => listSprints(input, { actorId }),
          }),
          listIssues: tool({
            name: 'listIssues',
            description: `List issues by project ID and status.`,
            inputSchema: ZListIssuesInput,
            execute: (input) => listIssues(input, { actorId }),
          }),
          listSources: tool({
            name: 'listSources',
            description: `List sources by agent ID.`,
            inputSchema: ZSourceListInput,
            execute: (input) => listSources(input, { actorId }),
          }),
          listStatuses: tool({
            name: 'listStatuses',
            description: `List issue statuses with optional filters.`,
            inputSchema: ZStatusListInput,
            execute: (input) => listStatuses(input, { actorId }),
          }),
          listRoles: tool({
            description: `List user roles with optional filters.`,
            inputSchema: ZRoleListInput,
            execute: (input) => listProjectRoles(input, { actorId }),
          }),
        },
        stopWhen: stepCountIs(50),
      });

      writer.merge(sub.toUIMessageStream({ sendStart: false, sendFinish: false }));
      const final = await sub.text;
      // log
      console.log(final);
      return JSON.parse(final);
    },
  });
