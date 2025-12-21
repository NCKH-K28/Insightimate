import { ZBoardIssueItem } from '@/contracts/boards/boards.query';
import { prisma } from '@/lib/prisma';
import { createId } from '@paralleldrive/cuid2';
import { Prisma } from '@prisma/client';
import merge from 'lodash/merge';

import z from 'zod';

type Context = { actorId: string };

// ================= [Get Issue] =================
export const ZGetIssueInput = z.object({ id: z.string() });
export const ZGetIssueOutput = ZBoardIssueItem.extend({
  _count: z.object({ subIssues: z.number() }),
});
export const getIssue = async ({ id }: z.infer<typeof ZGetIssueInput>, _context: Context) => {
  const boardIss = await prisma.boardIssue.findUnique({
    where: { issueId: id },
    include: {
      issue: {
        include: {
          type: true,
          priority: true,
          status: true,
          reporter: true,
          assignee: true,
          _count: { select: { subIssues: true } },
        },
      },
    },
  });

  if (!boardIss) throw new Error('Issue not found');
  const { issue, ...rest } = boardIss;
  return ZGetIssueOutput.parse({ ...issue, ...rest });
};

// ================= [List Issues] =================
const ZisoDate = z.iso.date();
export const ZListIssuesInput = z.object({
  q: z.string().optional().describe('Search by issue key, summary, description'),
  ids: z.array(z.string()).optional(),
  projectIds: z.array(z.string()).optional(),
  assigneeIds: z.array(z.string()).optional(),
  reporterIds: z.array(z.string()).optional(),
  statusIds: z.array(z.string()).optional(),
  priorityIds: z.array(z.string()).optional(),
  typeIds: z.array(z.string()).optional(),
  sprintIds: z.array(z.string().nullable()).optional(),
  categories: z.array(z.enum(['TODO', 'IN_PROGRESS', 'DONE'])).optional(),
  dueDate: z.object({ from: ZisoDate, to: ZisoDate }).optional(),
  startDate: z.object({ from: ZisoDate, to: ZisoDate }).optional(),
  createdAt: z.object({ from: ZisoDate, to: ZisoDate }).optional(),

  pagination: z.object({
    page: z.number().min(1),
    limit: z.number().min(10).max(100),
    sort: z.enum(['asc', 'desc']),
    sortBy: z.enum(['id', 'key', 'startDate', 'dueDate', 'createdAt', 'updatedAt']),
  }),
});
export const ZListIssuesOutput = z.object({
  data: z.array(ZBoardIssueItem),
  meta: z.object({ total: z.number(), page: z.number(), limit: z.number() }),
});

export const listIssues = async (
  {
    q,
    ids,
    projectIds,
    assigneeIds,
    reporterIds,
    statusIds,
    priorityIds,
    typeIds,
    sprintIds,
    categories,
    pagination,
    dueDate,
    startDate,
    createdAt,
  }: z.infer<typeof ZListIssuesInput>,
  _context: Context,
) => {
  const { page, limit, sort, sortBy } = pagination;

  const where: Prisma.BoardIssueWhereInput = {};

  if (q) {
    merge<Prisma.BoardIssueWhereInput, Prisma.BoardIssueWhereInput>(where, {
      issue: {
        OR: [
          { key: { contains: q, mode: 'insensitive' } },
          { summary: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
    });
  }

  merge<Prisma.BoardIssueWhereInput, Prisma.BoardIssueWhereInput>(where, {
    issue: {
      ...(ids && { id: { in: ids } }),
      ...(projectIds && { projectId: { in: projectIds } }),
      ...(assigneeIds && { assigneeId: { in: assigneeIds } }),
      ...(reporterIds && { reporterId: { in: reporterIds } }),
      ...(statusIds && { statusId: { in: statusIds } }),
      ...(priorityIds && { priorityId: { in: priorityIds } }),
      ...(typeIds && { typeId: { in: typeIds } }),
      ...(categories && { status: { category: { in: categories } } }),
    },
  });

  if (sprintIds && sprintIds.length > 0) {
    const hasNull = sprintIds.includes(null);
    const withoutNull = sprintIds.filter((id) => id !== null);
    const OR: Prisma.BoardIssueWhereInput[] = [];
    if (withoutNull.length > 0) OR.push({ sprintId: { in: withoutNull } });
    if (hasNull) OR.push({ sprintId: null });
    merge<Prisma.BoardIssueWhereInput, Prisma.BoardIssueWhereInput>(where, { OR });
  }

  if (dueDate) {
    const from = dueDate.from ? new Date(dueDate.from) : null;
    const to = dueDate.to ? new Date(dueDate.to) : null;
    merge<Prisma.BoardIssueWhereInput, Prisma.BoardIssueWhereInput>(where, {
      issue: { dueDate: { ...(from && { gte: from }), ...(to && { lte: to }) } },
    });
  }

  if (startDate) {
    const from = startDate.from ? new Date(startDate.from) : null;
    const to = startDate.to ? new Date(startDate.to) : null;
    merge<Prisma.BoardIssueWhereInput, Prisma.BoardIssueWhereInput>(where, {
      issue: { startDate: { ...(from && { gte: from }), ...(to && { lte: to }) } },
    });
  }

  if (createdAt) {
    const from = createdAt.from ? new Date(createdAt.from) : null;
    const to = createdAt.to ? new Date(createdAt.to) : null;
    merge<Prisma.BoardIssueWhereInput, Prisma.BoardIssueWhereInput>(where, {
      issue: { createdAt: { ...(from && { gte: from }), ...(to && { lte: to }) } },
    });
  }

  const boardIssues = await prisma.boardIssue.findMany({
    where,
    include: {
      issue: {
        include: {
          type: true,
          priority: true,
          status: true,
          reporter: true,
          assignee: true,
          _count: { select: { subIssues: true } },
        },
      },
    },
    take: limit,
    skip: (page - 1) * limit,
    orderBy: { issue: { [sortBy]: sort } },
  });

  const issues = boardIssues.map(({ issue, ...b }) => ({ ...issue, ...b }));
  const total = await prisma.boardIssue.count({ where });
  return ZListIssuesOutput.parse({ data: issues, meta: { total, page, limit } });
};

// ================= [Patch operation] =================
export const ZCreateIssueInput = z.object({
  projectId: z.string(),
  summary: z.string().min(1),
  description: z.string().nullish(),
  reporterId: z.string().nullish(),
  typeId: z.string(),
  priorityId: z.string(),
  statusId: z.string(),
  sprintId: z.string().nullish(),
  parentId: z.string().nullish(),
});
export const ZDeleteIssueInput = z.object({ id: z.string() });
export const ZUpdateIssueInput = z.object({
  id: z.string(),
  summary: ZCreateIssueInput.shape.summary.optional(),
  description: ZCreateIssueInput.shape.description.optional(),
  reporterId: ZCreateIssueInput.shape.reporterId.optional(),
  typeId: ZCreateIssueInput.shape.typeId.optional(),
  priorityId: ZCreateIssueInput.shape.priorityId.optional(),
  statusId: ZCreateIssueInput.shape.statusId.optional(),
  sprintId: ZCreateIssueInput.shape.sprintId.nullish(),
});
export const ZPatchIssueInput = z.object({
  creates: z.array(ZCreateIssueInput).max(50).optional(),
  updates: z.array(ZUpdateIssueInput).max(50).optional(),
  deletes: z.array(ZDeleteIssueInput).max(50).optional(),
});

export const patchIssues = async (
  { creates, updates, deletes }: z.infer<typeof ZPatchIssueInput>,
  _context: Context,
) => {
  await prisma.$transaction(async (tx) => {
    // ----- CREATES (sequential) -----
    if (creates?.length) {
      for (const create of creates) {
        const proj = await tx.project.update({
          where: { id: create.projectId },
          data: { issueCounter: { increment: 1 } },
          include: { statuses: true, board: { select: { id: true } } },
        });

        if (!proj.board) throw new Error('Board not found');

        // status must belong to this project (friendly error + category needed)
        const status = proj.statuses.find((s) => s.id === create.statusId);
        if (!status) throw new Error('Status not found');

        await tx.boardIssue.create({
          data: {
            issue: {
              create: {
                id: `iss_${createId()}`,
                projectId: create.projectId,
                key: `${proj.key}-${proj.issueCounter}`,
                summary: create.summary,
                description: create.description,
                reporterId: create.reporterId,
                typeId: create.typeId, // DB composite FK will enforce same project
                priorityId: create.priorityId, // DB composite FK will enforce same project
                statusId: create.statusId,
                resolvedAt: status.category === 'DONE' ? new Date() : null,
              },
            },
            board: { connect: { id: proj.board.id } },
            sprint: create.sprintId
              ? { connect: { id: create.sprintId, boardId: proj.board.id } } // DB enforces sprint belongs to board
              : undefined,
            rank: 0,
          },
        });
      }
    }

    // ----- UPDATES (sequential) -----
    if (updates?.length) {
      for (const update of updates) {
        const bi = await tx.boardIssue.findUnique({
          where: { issueId: update.id },
          include: { issue: { select: { projectId: true, resolvedAt: true } } },
        });
        if (!bi) throw new Error('Issue not found');

        const projectId = bi.issue.projectId;
        const boardId = bi.boardId;

        const nextStatus = update.statusId
          ? await tx.issueStatus.findUniqueOrThrow({
              where: { projectId_id: { projectId, id: update.statusId } },
              select: { category: true },
            })
          : null;

        const nextResolvedAt = nextStatus
          ? nextStatus.category === 'DONE'
            ? (bi.issue.resolvedAt ?? new Date())
            : null
          : undefined;

        await tx.boardIssue.update({
          where: { issueId: update.id },
          data: {
            issue: {
              update: {
                summary: update.summary,
                description: update.description,
                reporterId: update.reporterId,
                typeId: update.typeId,
                priorityId: update.priorityId,
                statusId: update.statusId,
                resolvedAt: nextResolvedAt,
              },
            },
            sprint: update.sprintId ? { connect: { id: update.sprintId, boardId } } : undefined, // NOTE: this does NOT clear sprint; it keeps current sprint
          },
        });
      }
    }

    // ----- DELETES (idempotent) -----
    if (deletes?.length) {
      await tx.boardIssue.deleteMany({ where: { issueId: { in: deletes.map((d) => d.id) } } });
    }
  });
};

export const ZIssueMetricsInput = z.object({
  filters: ZListIssuesInput.omit({ pagination: true }),
});

export const ZIssueMetricsOutput = z.object({
  counts: z.object({
    total: z.number(),
    done: z.number(),
    todo: z.number(),
    inProgress: z.number(),
  }),
  // breakdowns: z.array(),
});

export const issueMetrics = async (
  input: z.infer<typeof ZIssueMetricsInput>,
  _context: Context,
) => {
  const { filters } = input;
  const pagination = { page: 1, limit: 1000000, sort: 'asc', sortBy: 'id' } as const;
  const issues = await listIssues({ ...filters, pagination }, _context);

  const counts = {
    total: issues.data.length,
    done: issues.data.filter((i) => i.status.category === 'DONE').length,
    todo: issues.data.filter((i) => i.status.category === 'TODO').length,
    inProgress: issues.data.filter((i) => i.status.category === 'IN_PROGRESS').length,
  };
  return ZIssueMetricsOutput.parse({ counts });
};
