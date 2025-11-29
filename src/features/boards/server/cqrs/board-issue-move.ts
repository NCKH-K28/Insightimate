import { BoardIssueMoveInput } from '@/contracts/boards/boards.input';
import { prisma } from '@/lib/prisma';
import LexRank from '@/lib/utils/lexorank-num';
import Decimal from 'decimal.js';

const ranker = LexRank.create({ precision: 10, initialRank: 1, stepSize: 1 });

const getLastIssue = async (parentId: string | null, parentField: 'sprintId' | 'statusId') => {
  if (parentField === 'statusId') {
    const issue = await prisma.boardIssue.findFirst({
      where: { issue: { statusId: parentId ?? undefined } }, // nullable statusId
      orderBy: { rank: 'desc' },
    });
    return issue;
  } else if (parentField === 'sprintId') {
    const issue = await prisma.boardIssue.findFirst({
      where: { sprintId: parentId },
      orderBy: { rank: 'desc' },
    });
    return issue;
  }

  throw new Error('Invalid parent field');
};

const getFirstIssue = async (parentId: string | null, parentField: 'sprintId' | 'statusId') => {
  if (parentField === 'statusId') {
    const issue = await prisma.boardIssue.findFirst({
      where: { issue: { statusId: parentId ?? undefined } }, // nullable statusId
      orderBy: { rank: 'asc' },
    });
    return issue;
  }
  if (parentField === 'sprintId') {
    const issue = await prisma.boardIssue.findFirst({
      where: { sprintId: parentId },
      orderBy: { rank: 'asc' },
    });
    return issue;
  }
  throw new Error('Invalid parent field');
};

const getAfterIssue = async (
  rank: Decimal,
  parentId: string | null,
  parentField: 'sprintId' | 'statusId',
) => {
  if (parentField === 'statusId') {
    const issue = await prisma.boardIssue.findFirst({
      where: { issue: { statusId: parentId ?? undefined }, rank: { gt: rank } }, // nullable statusId
      orderBy: { rank: 'asc' },
    });
    return issue;
  } else if (parentField === 'sprintId') {
    const issue = await prisma.boardIssue.findFirst({
      where: { [parentField]: parentId, rank: { gt: rank } },
      orderBy: { rank: 'asc' },
    });
    return issue;
  }

  throw new Error('Invalid parent field');
};

const getBeforeIssue = async (
  rank: Decimal,
  parentId: string | null,
  parentField: 'sprintId' | 'statusId',
) => {
  if (parentField === 'statusId') {
    const issue = await prisma.boardIssue.findFirst({
      where: { issue: { statusId: parentId ?? undefined }, rank: { lt: rank } }, // nullable statusId
      orderBy: { rank: 'desc' },
    });
    return issue;
  } else if (parentField === 'sprintId') {
    const issue = await prisma.boardIssue.findFirst({
      where: { [parentField]: parentId, rank: { lt: rank } },
      orderBy: { rank: 'desc' },
    });
    return issue;
  }

  throw new Error('Invalid parent field');
};

const getDestRanks = async (
  params: { issueId: string; boardId: string },
  input: BoardIssueMoveInput,
  parentField: 'sprintId' | 'statusId',
) => {
  const srcIssue = await prisma.boardIssue.findUniqueOrThrow({
    where: { issueId_boardId: params },
  });
  const currentRank = srcIssue?.rank;
  if (!currentRank) throw new Error('Source issue not found in the parent');

  const [firstIssue, lastIssue] = await Promise.all([
    getFirstIssue(input.to.parentId, parentField),
    getLastIssue(input.to.parentId, parentField),
  ]);
  if (!firstIssue && !lastIssue) {
    const newRank = ranker.first();
    return { beforeRank: null, afterRank: null, currentRank, newRank };
  }

  const relative = input.relative;
  if (relative.type === 'top') {
    if (!firstIssue) throw new Error('No issues in the destination to rank before');
    const newRank = ranker.before(firstIssue.rank);
    return { beforeRank: null, afterRank: ranker.toDecimal(firstIssue.rank), currentRank, newRank };
  } else if (relative.type === 'bottom') {
    if (!lastIssue) throw new Error('No issues in the destination to rank after');
    const newRank = ranker.after(lastIssue.rank);
    return { beforeRank: ranker.toDecimal(lastIssue.rank), afterRank: null, currentRank, newRank };
  } else if (relative.type === 'after') {
    const destIssue = await prisma.boardIssue.findUniqueOrThrow({
      where: { issueId: relative.refId },
    });
    const afterIssue = await getAfterIssue(destIssue.rank, input.to.parentId, parentField);
    const newRank = afterIssue
      ? ranker.between(destIssue.rank, afterIssue.rank)
      : ranker.prev(destIssue.rank);
    return {
      beforeRank: ranker.toDecimal(destIssue.rank),
      afterRank: afterIssue ? ranker.toDecimal(afterIssue.rank) : null,
      currentRank,
      newRank,
    };
  } else if (relative.type === 'before') {
    const destIssue = await prisma.boardIssue.findUniqueOrThrow({
      where: { issueId: relative.refId },
    });
    const beforeIssue = await getBeforeIssue(destIssue.rank, input.to.parentId, parentField);
    const newRank = beforeIssue
      ? ranker.between(beforeIssue.rank, destIssue.rank)
      : ranker.next(destIssue.rank);
    return {
      beforeRank: beforeIssue ? ranker.toDecimal(beforeIssue.rank) : null,
      afterRank: ranker.toDecimal(destIssue.rank),
      currentRank,
      newRank,
    };
  }
  throw new Error('Invalid destination type');
};

export const moveBoardIssue = async (
  params: { boardId: string; issueId: string },
  input: BoardIssueMoveInput,
) => {
  const parentField = input.parentType === 'sprint' ? 'sprintId' : 'statusId';
  const destRanks = await getDestRanks(params, input, parentField);

  if (input.parentType === 'status') {
    const updated = await prisma.boardIssue.update({
      where: params,
      data: {
        issue: { update: { statusId: input.to.parentId ?? undefined } },
        rank: destRanks.newRank,
      },
    });
    if (!updated) throw new Error('Failed to update issue rank');
    return updated;
  } else if (input.parentType === 'sprint') {
    const updated = await prisma.boardIssue.update({
      where: params,
      data: { sprintId: input.to.parentId, rank: destRanks.newRank },
    });
    if (!updated) throw new Error('Failed to update issue rank');
    return updated;
  }
  throw new Error('Invalid parent field');
};
