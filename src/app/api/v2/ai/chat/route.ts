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
import { seed } from './server/issue-seed';
import { ZSourceListInput } from '@/features/agents/server/services/source.service';
import { listBoards, ZBoardListInput } from '@/features/agents/server/cqrs/q-board-list';
import { listSprints, ZSprintListInput } from '@/features/agents/server/cqrs/q-sprint-list';
import { prisma } from '@/lib/prisma';
import z from 'zod';
import {
  listIssues,
  listProjects,
  listSources,
  listStatuses,
  ZListIssuesInput,
  ZProjectListInput,
  ZStatusListInput,
} from '@/features/agents/server/cqrs';
import { listProjectRoles, ZRoleListInput } from '@/features/agents/server/cqrs/q-role-list';
import { IssueGenTool } from '@/features/agents/server/tools/issue-gen-tool';

// ==== Route ====
export const POST = middlewareHandler([authenticated], async (req) => {
  await seed();

  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const body = await req.json();
  const { messages = [], agentId } = body;
  if (!agentId) throw new Error('agentId is required');

  const stream = createUIMessageStream({
    async execute({ writer }) {
      const result = streamText({
        model: google('gemini-2.5-flash'),
        messages: convertToModelMessages(messages.slice(-8)),
        tools: {
          pmSearch: tool({
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
          }),
          genIssue: IssueGenTool,
        },
        stopWhen: stepCountIs(50),
      });

      writer.merge(result.toUIMessageStream({ sendFinish: false }));
      await result.consumeStream();
    },
  });

  return createUIMessageStreamResponse({ stream });
});
