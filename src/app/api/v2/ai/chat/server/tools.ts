import { tool } from 'ai';
import { listIssues, ZListIssuesInput } from './list-issues';
import z from 'zod';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';

export const listIssuesTool = tool({
  name: 'listIssues',
  description:
    'List issues with optional filters (assignee, status, due dates, createdAt, keyword), pagination, and sorting.',
  inputSchema: ZListIssuesInput,
  outputSchema: z.object({
    data: z.array(z.any()),
    // meta: z.object({}).describe('Pagination metadata.'),
  }),
  execute: (input: z.infer<typeof ZListIssuesInput>) => listIssues(input),
});

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
