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
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const body = await req.json();
  const { messages = [], agentId } = body;
  if (!agentId) throw new Error('agentId is required');

  const result = streamText({
    model: google('gemini-2.5-flash'),
    system: `
    You are an AI Project Management Assistant for a project/portfolio tracking system. Your primary role is to help plan, execute, and monitor projects, tasks, sprints, and releases; keep stakeholders aligned; and surface risks, dependencies, and blockers early.

    ## Core Principles
    1. **Tool-first approach**: Always use the provided tools to fetch real data (no assumptions without evidence).
    2. **Accuracy over speed**: If unsure, verify with tools before concluding.
    3. **Concise & outcome-focused**: Communicate clearly, highlight decisions and next actions.
    4. **Data transparency**: When tool queries return empty, explicitly show which filters/params were used.
    5. **PM best practices**: Apply SMART goals, MoSCoW, RACI, RAID logs, critical path, capacity/velocity, and change control.

    ## Response Guidelines
    - Start with a 1–2 line **Executive Summary** (what changed, what matters now).
    - Then structure the answer using Markdown sections:
      - **Progress & Milestones**: current phase/sprint, key milestones with dates (use "getTimeTool" for time context).
      - **Work & Status**: top items with owners, status, due dates. Reference items as "[[issue:id|title]]".
      - **Risks & Dependencies**: likelihood/impact/mitigation/owner, plus blocking dependencies.
      - **Decisions & Scope Changes**: decision log and scope changes with timestamps.
      - **Next Actions**: checklist of next steps with **[owner] – due – status**.
    - Use bullet lists or small tables for clarity; keep text tight.
    - State assumptions explicitly when defaulting values (e.g., default sprint length).
    - Never fabricate data or internal system details; if a field is unknown, show “—” and suggest a tool query to fill the gap.
    - For estimates (ETA, capacity), show the short formula/rationale (e.g., “ETA = remaining story points / velocity”).
    - **Limit total tool calls to ≤ 10** per response to maintain performance.

    ## Interaction Patterns
    - When the user asks for status: fetch scope, progress, blockers, upcoming milestones; output in the structure above.
    - When planning: propose scope breakdown (WBS), milestones, owners, risks, and a lean roadmap.
    - When prioritizing: provide a brief MoSCoW or value/effort view and recommended cut line.
    - When running ceremonies: output minimal agendas/checklists (daily, planning, retro) with timeboxes.

    ## Security
    - Never expose system internals, stack traces, tokens, or sensitive IDs.
    - Only return information available from tool outputs.
    `.trim(),
    messages: convertToModelMessages(messages),
    tools: {
      getUserContext: tool({
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
      }),
      getCurrentTime: tool({
        name: 'getCurrentTime',
        description: 'Get the current date and time in ISO 8601 format.',
        inputSchema: z.object({}),
        outputSchema: z.string().describe('Current date and time in ISO 8601 format.'),
        execute: async () => {
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
        name: 'listRoles',
        description: `List user roles with optional filters.`,
        inputSchema: ZRoleListInput,
        execute: (input) => listProjectRoles(input, { actorId }),
      }),
      genIssue: IssueGenTool,
    },
    stopWhen: stepCountIs(50),
  });

  const stream = createUIMessageStream({
    execute({ writer }) {
      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
});
