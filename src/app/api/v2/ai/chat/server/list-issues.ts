import z from 'zod';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { endOfDay } from 'date-fns';

// ==== Schemas ====
const validateDateRange = (i: { from?: string; to?: string }, ctx: z.RefinementCtx) => {
  if (!i.from || !i.to) return;
  if (new Date(i.from) < new Date(i.to)) return;
  ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'from must be < to' });
};

const ZIsoDate = z.iso.datetime();
const ZDateRange = z
  .object({ from: ZIsoDate.optional(), to: ZIsoDate.optional() })
  .superRefine(validateDateRange)
  .describe('Date range with from and to ISO date strings');

export const ZIssueFilter = z.object({
  q: z.string().min(1).optional().describe('Keyword search in issue summary and description'),
  assigneeIds: z.array(z.string()).min(1).optional().describe('Filter by assignee IDs'),
  status: z.array(z.enum(['TODO', 'IN_PROGRESS', 'DONE'])).optional(),
  dueDate: ZDateRange.optional().describe('Filter by due date range'),
  createdAt: ZDateRange.optional().describe('Filter by creation date range'),
  orderBy: z
    .object({
      field: z.enum(['createdAt', 'dueDate', 'updatedAt']),
      direction: z.enum(['asc', 'desc']).default('desc'),
    })
    .optional()
    .describe('Sorting options'),
});

export const ZPagination = z.object({
  take: z.number().int().min(1).max(50).default(20).optional(),
  cursor: z.string().optional().describe('Cursor ID for pagination'),
});

type IssueFilter = z.infer<typeof ZIssueFilter>;

const buildIssueWhere = (filter?: IssueFilter): Prisma.IssueWhereInput => {
  const where: Prisma.IssueWhereInput = {};

  if (!filter) return where;

  if (filter.assigneeIds?.length) where.assigneeId = { in: filter.assigneeIds };
  if (filter.status?.length) where.status = { category: { in: filter.status } };

  if (filter.dueDate) {
    where.dueDate = {};
    if (filter.dueDate.from) where.dueDate.gte = new Date(filter.dueDate.from);
    if (filter.dueDate.to) where.dueDate.lte = endOfDay(new Date(filter.dueDate.to));
  }
  if (filter.createdAt) {
    where.createdAt = {};
    if (filter.createdAt.from) where.createdAt.gte = new Date(filter.createdAt.from);
    if (filter.createdAt.to) where.createdAt.lte = endOfDay(new Date(filter.createdAt.to));
  }

  if (filter.q) {
    const OR: Prisma.IssueWhereInput[] = [
      { summary: { contains: filter.q, mode: 'insensitive' } },
      { description: { contains: filter.q, mode: 'insensitive' } },
    ];
    where.OR = OR;
  }

  return where;
};

export const ZListIssuesInput = z.object({
  filter: ZIssueFilter.optional(),
  pagination: ZPagination.optional(),
});
type ListIssuesInput = z.infer<typeof ZListIssuesInput>;
export const listIssues = async (input: ListIssuesInput) => {
  const parsed = ZListIssuesInput.parse(input);
  const where = buildIssueWhere(parsed.filter);

  const take = parsed.pagination?.take ?? 20;
  const cursor = parsed.pagination?.cursor ? { id: parsed.pagination.cursor } : undefined;
  const orderBy: Prisma.Enumerable<Prisma.IssueOrderByWithRelationInput> = parsed.filter?.orderBy
    ? { [parsed.filter.orderBy.field]: parsed.filter.orderBy.direction }
    : { createdAt: 'desc' };

  const rows = await prisma.issue.findMany({
    where,
    take: take + 1,
    ...(cursor ? { skip: 1, cursor } : {}),
    orderBy,
  });

  const nextCursor = rows.length > take ? rows[take].id : null;
  const data = rows.slice(0, take);

  const total = await prisma.issue.count({ where });

  const markedData = data.map((issue) => `[[issue:${issue.key}|${issue.summary}]]`);

  return {
    data: markedData,
    nextCursor,
    total,
    applied: { where, take, orderBy, cursor: parsed.pagination?.cursor ?? null },
  };
};
