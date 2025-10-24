import { authenticated, getAuthFromRequest } from '@/lib/auth';
import { openfgaClient } from '@/lib/authz/openfga';
import { compose } from '@/lib/http/api-compose';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const DateRange = z
  .object({ from: z.iso.date().optional(), to: z.iso.date().optional() })
  .refine((i) => {
    if (!i.from || !i.to) return true;
    if (new Date(i.from) < new Date(i.to)) return true;
    return false;
  }, 'from must be < to')
  .describe('Date range with from and to ISO date strings');

const DateOperator = z
  .object({ op: z.enum(['gt', 'lt', 'gte', 'lte', 'equals']), value: z.iso.date() })
  .describe(
    'Date filter with operator and value, e.g., { op: "gt", value: "2023-01-01T00:00:00Z" }',
  );

const DateFilter = z
  .union([DateRange, DateOperator])
  .describe('Date filter which can be a range or an operator-based filter');

export const IssueFilter = z.object({
  q: z.string().min(1).optional().describe('Keyword search in issue summary and description'),
  assigneeIds: z.array(z.string()).min(1).optional().describe('Filter by assignee IDs'),
  statusCategories: z.array(z.enum(['TODO', 'IN_PROGRESS', 'DONE'])).optional(),
  statusIds: z.array(z.string()).min(1).optional().describe('Filter by status IDs'),
  projectIds: z.array(z.string()).min(1).optional().describe('Filter by project IDs'),
  dueDate: DateFilter.optional().describe('Filter by due date'),
});

export const Order = z.object({
  field: z.enum(['createdAt', 'dueDate', 'updatedAt']),
  direction: z.enum(['asc', 'desc']).default('desc'),
});

export const ZPagination = z.object({
  take: z.number().int().min(1).max(50).default(20).optional(),
  cursor: z.string().optional().describe('Cursor ID for pagination'),
});

export const ZListIssuesInput = z.object({
  filter: IssueFilter.optional(),
  pagination: ZPagination.optional(),
  order: Order.optional(),
  includes: z
    .object({ assignee: z.boolean().optional(), status: z.boolean().optional() })
    .optional(),
});

export const ZListIssuesOutput = z.object({
  data: z.array(z.any()),
  meta: z.object({ nextCursor: z.string().optional() }),
});

type IssueFilter = z.infer<typeof IssueFilter>;

export type ListIssuesInput = z.infer<typeof ZListIssuesInput>;
export type ListIssuesOutput = z.infer<typeof ZListIssuesOutput>;

const allowedProjectIds = async (input: ListIssuesInput, context: { actorId: string }) => {
  const { projectIds } = input.filter || {};
  if (!projectIds || projectIds.length === 0) {
    const { objects } = await openfgaClient.listObjects({
      type: 'project',
      user: `user:${context.actorId}`,
      relation: 'can_view',
    });
    const ids = objects.map((obj) => obj.replace('project:', ''));
    return ids;
  }

  const check = await openfgaClient.batchCheck({
    checks: projectIds.map((projectId) => ({
      type: 'project',
      object: `project:${projectId}`,
      relation: 'can_view',
      user: `user:${context.actorId}`,
    })),
  });

  const notAllowed = check.result.some((res) => res.allowed === false);
  if (notAllowed) throw new Error('Access denied to one or more projects');
  return projectIds;
};

const buildIssueWhere = (filter: IssueFilter): Prisma.IssueWhereInput => {
  const where: Prisma.IssueWhereInput = { projectId: { in: filter.projectIds } };
  if (filter.assigneeIds?.length) where.assigneeId = { in: filter.assigneeIds };

  if (filter.dueDate) {
    if ('from' in filter.dueDate || 'to' in filter.dueDate) {
      where.dueDate = {};
      if (filter.dueDate.from) where.dueDate.gte = new Date(filter.dueDate.from);
      if (filter.dueDate.to) where.dueDate.lte = new Date(filter.dueDate.to);
    } else if ('op' in filter.dueDate && 'value' in filter.dueDate) {
      const date = new Date(filter.dueDate.value);
      const { op } = filter.dueDate;
      where.dueDate = { [op]: date };
    }
  }

  // search
  if (filter.q && filter.q.length) {
    // log
    const OR: Prisma.IssueWhereInput[] = [
      { summary: { contains: filter.q, mode: 'insensitive' } },
      { description: { contains: filter.q, mode: 'insensitive' } },
    ];
    where.OR = OR;
  }

  where.status = {
    id: filter.statusIds ? { in: filter.statusIds } : undefined,
    category: filter.statusCategories ? { in: filter.statusCategories } : undefined,
  };

  return where;
};

export const listIssues = async (
  input: ListIssuesInput,
  context: { actorId: string },
): Promise<ListIssuesOutput> => {
  const allowedIds = await allowedProjectIds(input, context);
  if (allowedIds.length === 0) return { data: [], meta: {} };
  const where = buildIssueWhere({ ...input.filter, projectIds: allowedIds });
  const take = input.pagination?.take ?? 20;
  const cursor = input.pagination?.cursor ? { id: input.pagination.cursor } : undefined;
  const rows = await prisma.issue.findMany({
    where,
    take: take + 1,
    ...(cursor ? { skip: 1, cursor } : {}),
    orderBy: input.order ? { [input.order.field]: input.order.direction } : { createdAt: 'desc' },
    include: input.includes,
  });

  const nextCursor = rows.length > take ? rows[take].id : null;
  const data = rows.slice(0, take);
  return { data, meta: { nextCursor: nextCursor ?? undefined } };
};

export const GET = compose(
  (req) => authenticated(req, req.params),
  async (req) => {
    const auth = await getAuthFromRequest(req);
    const actorId = auth.user.id;

    const input = ZListIssuesInput.strict().parse(req.query);
    // og
    console.log('List Issues Input:', input);
    if (!actorId) throw new Error('Unauthorized');

    const result = await listIssues(input, { actorId });

    return NextResponse.json(result);
  },
);
