import { ZSprintItem } from '@/contracts/boards/boards.query';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import merge from 'lodash/merge';
import { Prisma } from '@prisma/client';

type Context = { actorId: string };
const ZExtendSprint = ZSprintItem.extend({ projectId: z.string() });

export const ZGetSprintInput = z.object({ id: z.string() });
export const ZGetSprintOutput = ZExtendSprint;
export const getSprint = async ({ id }: z.infer<typeof ZGetSprintInput>, _context: Context) => {
  const sprint = await prisma.sprint.findUnique({
    where: { id },
    include: { board: { select: { projectId: true } } },
  });
  if (!sprint) throw new Error('Sprint not found');

  return ZGetSprintOutput.parse({ ...sprint, projectId: sprint.board.projectId });
};

const ZisoDate = z.iso.date();
export const ZListSprintsInput = z.object({
  q: z.string().optional(),
  boardIds: z.array(z.string()).optional(),
  projectIds: z.array(z.string()).optional(),
  startAt: z.object({ gte: ZisoDate.optional(), lte: ZisoDate.optional() }).optional(),
  endAt: z.object({ gte: ZisoDate.optional(), lte: ZisoDate.optional() }).optional(),
  statuses: z.array(z.enum(['FUTURE', 'ACTIVE', 'CLOSED'])).optional(),

  pagination: z.object({
    page: z.number().min(1),
    limit: z.number().min(10).max(100),
    sort: z.enum(['asc', 'desc']),
    sortBy: z.enum(['startAt', 'endAt']),
  }),
});

export const ZListSprintsOutput = z.object({
  data: ZExtendSprint.array(),
  meta: z.object({ total: z.number(), page: z.number(), limit: z.number() }),
});

export const listSprints = async (input: z.infer<typeof ZListSprintsInput>, _context: Context) => {
  const {
    q,
    boardIds,
    projectIds,
    statuses,
    startAt,
    endAt,
    pagination: { page, limit, sort, sortBy },
  } = input;

  const where: Prisma.SprintWhereInput = {};

  if (q) {
    merge(where, {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { goal: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  if (boardIds?.length) merge(where, { boardId: { in: boardIds } });
  if (projectIds?.length) merge(where, { board: { is: { projectId: { in: projectIds } } } });

  if (startAt) merge(where, { startAt: { gte: startAt.gte, lte: startAt.lte } });
  if (endAt) merge(where, { endAt: { gte: endAt.gte, lte: endAt.lte } });
  if (statuses?.length) merge(where, { status: { in: statuses } });

  const sprints = await prisma.sprint.findMany({
    where,
    include: { board: { select: { projectId: true } } },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { [sortBy]: sort },
  });

  const total = await prisma.sprint.count({ where });

  const data = sprints.map((sprint) => ({ ...sprint, projectId: sprint.board.projectId }));
  return ZListSprintsOutput.parse({ data, meta: { total, page, limit } });
};
