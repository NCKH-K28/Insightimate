import { BoardIssueRankUpdate } from '@/contracts/boards/board.input';
import { prisma } from '@/lib/prisma';
import LexRank from '@/lib/utils/lexorank-num';
import Decimal from 'decimal.js';

const ranker = LexRank.create({ precision: 10, initialRank: 1, stepSize: 1 });

const getLastIssue = async (parentId: string | null, parentField: 'sprintId' | 'columnId') => {
  const issue = await prisma.boardIssue.findFirst({
    where: { [parentField]: parentId },
    orderBy: { rank: 'desc', issueId: 'desc' },
  });
  return issue;
};

const getFirstIssue = async (parentId: string | null, parentField: 'sprintId' | 'columnId') => {
  const issue = await prisma.boardIssue.findFirst({
    where: { [parentField]: parentId },
    orderBy: { rank: 'asc', issueId: 'asc' },
  });
  return issue;
};

const getAfterIssue = async (
  rank: Decimal,
  parentId: string | null,
  parentField: 'sprintId' | 'columnId',
) => {
  const issue = await prisma.boardIssue.findFirst({
    where: { [parentField]: parentId, rank: { gt: rank } },
    orderBy: { rank: 'asc', issueId: 'asc' },
  });
  return issue;
};

const getBeforeIssue = async (
  rank: Decimal,
  parentId: string | null,
  parentField: 'sprintId' | 'columnId',
) => {
  const issue = await prisma.boardIssue.findFirst({
    where: { [parentField]: parentId, rank: { lt: rank } },
    orderBy: { rank: 'desc', issueId: 'desc' },
  });
  return issue;
};

const getIssueRank = async (
  issueId: string,
  parentId: string | null,
  parentField: 'sprintId' | 'columnId',
) => {
  const issue = await prisma.boardIssue.findFirst({
    where: { issueId, [parentField]: parentId },
    orderBy: { rank: 'asc', issueId: 'asc' },
  });
  return issue?.rank;
};

const getDestRanks = async (
  src: BoardIssueRankUpdate['src'],
  dest: BoardIssueRankUpdate['dest'],
  parentField: 'sprintId' | 'columnId',
) => {
  const destType = dest.type;
  const currentRank = await getIssueRank(src.id, src.parentId, parentField);
  if (!currentRank) throw new Error('Source issue not found in the parent');

  const [firstIssue, lastIssue] = await Promise.all([
    getFirstIssue(dest.parentId, parentField),
    getLastIssue(dest.parentId, parentField),
  ]);
  if (!firstIssue && !lastIssue) {
    const newRank = ranker.first();
    return { beforeRank: null, afterRank: null, currentRank, newRank };
  }

  if (destType === 'top') {
    if (!firstIssue) throw new Error('No issues in the destination to rank before');
    const newRank = ranker.before(firstIssue.rank);
    return { beforeRank: null, afterRank: ranker.toDecimal(firstIssue.rank), currentRank, newRank };
  } else if (destType === 'bottom') {
    if (!lastIssue) throw new Error('No issues in the destination to rank after');
    const newRank = ranker.after(lastIssue.rank);
    return { beforeRank: ranker.toDecimal(lastIssue.rank), afterRank: null, currentRank, newRank };
  } else if (destType === 'after') {
    if (!dest.id) throw new Error('Destination issue id is required for after type');
    const destIssue = await prisma.boardIssue.findUniqueOrThrow({ where: { issueId: dest.id } });
    const afterIssue = await getAfterIssue(destIssue.rank, dest.parentId, parentField);
    const newRank = afterIssue
      ? ranker.between(destIssue.rank, afterIssue.rank)
      : ranker.prev(destIssue.rank);
    return {
      beforeRank: ranker.toDecimal(destIssue.rank),
      afterRank: afterIssue ? ranker.toDecimal(afterIssue.rank) : null,
      currentRank,
      newRank,
    };
  } else if (destType === 'before') {
    if (!dest.id) throw new Error('Destination issue id is required for before type');
    const destIssue = await prisma.boardIssue.findUniqueOrThrow({ where: { issueId: dest.id } });
    const beforeIssue = await getBeforeIssue(destIssue.rank, dest.parentId, parentField);
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

export const updateIssueRank = async (boardId: string, input: BoardIssueRankUpdate) => {
  const { src, dest, in: boardType } = input;
  const parentField = boardType === 'SCRUM' ? 'sprintId' : 'columnId';
  const destRanks = await getDestRanks(src, dest, parentField);

  const updated = await prisma.boardIssue.update({
    where: { issueId: src.id, rank: destRanks.currentRank, [parentField]: src.parentId },
    data: { rank: destRanks.newRank, [parentField]: dest.parentId },
  });
  if (!updated) throw new Error('Failed to update issue rank');
  return updated;
};
