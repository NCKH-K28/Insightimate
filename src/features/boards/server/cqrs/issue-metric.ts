/* eslint-disable @typescript-eslint/no-unused-vars */

import { prisma } from '@/lib/prisma';

type Context = { boardId: string };

type QueryParams = {
  groupBy: 'completed';
  filter?: { sprintId?: string | null };
  sum?: { storyPoints?: boolean };
};

export const getIssueMetrics = (query: QueryParams, context: Context) => {
  // const { boardId } = context;
  // const { groupBy, filter, sum } = query;
  // const where: any = { boardId };
  // const board = prisma.board.findUnique({ where: { id: boardId } });
  // if (!board) throw new Error('Board not found');
  // if (filter?.sprintId !== undefined) where.sprintId = filter.sprintId;
  // const d = prisma.issue.aggregate({
  //   where: {
  //     sprint: {
  //       every: {},
  //     },
  //   },
  //   _count: {
  //     _all: true,
  //   },
  // });
  // return prisma.boardIssue.aggregate({
  //   where,
  //   _count: {
  //     _all: true,
  //   },
  // });

  return {
    data: {
      completed: { count: 0, storyPoints: 0 },
      incomplete: { count: 0, storyPoints: 0 },
    },
    total: { count: 0, storyPoints: 0 },
  };
};
