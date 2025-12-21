import { BoardIssueMoveInput } from '@/contracts/boards/boards.input';
import { ZBoardIssueItem } from '@/contracts/boards/boards.query';
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
    where: { issueId: params.issueId },
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

export const moveInColumn = async (
  params: { boardId: string; issueId: string },
  input: BoardIssueMoveInput,
) => {
  if (input.parentType !== 'column') throw new Error('Invalid parent type');
  if (!input.from.parentId) throw new Error('Invalid source parent id');
  if (!input.to.parentId) throw new Error('Invalid destination parent id');

  const fromColId = input.from.parentId;
  const toColId = input.to.parentId;

  return prisma.$transaction(async (tx) => {
    const [src, fromCol, toCol] = await Promise.all([
      tx.boardIssue.findUniqueOrThrow({
        where: { issueId: params.issueId },
        include: { issue: { select: { statusId: true } } },
      }),
      tx.boardColumn.findUniqueOrThrow({
        where: { id: fromColId },
        include: { statuses: { select: { statusId: true } } },
      }),
      tx.boardColumn.findUniqueOrThrow({
        where: { id: toColId },
        include: {
          statuses: {
            include: { status: { select: { id: true, category: true } } },
          },
        },
      }),
    ]);

    const srcStatusId = src.issue?.statusId ?? null;

    const fromStatusIds = fromCol.statuses.map((s) => s.statusId);
    const toStatuses = toCol.statuses.map((x) => x.status);
    const toStatusIds = toStatuses.map((s) => s.id);

    if (toStatusIds.length === 0) throw new Error('Destination column has no statuses');

    // (optional) strict validate source col
    if (srcStatusId && !fromStatusIds.includes(srcStatusId)) {
      throw new Error('Source issue is not in source column');
    }

    const scopeWhere = {
      boardId: params.boardId,
      issue: { statusId: { in: toStatusIds } },
      NOT: { issueId: params.issueId }, // exclude the moving issue
    } as const;

    const relative = input.relative;

    // helpers
    const first = () => tx.boardIssue.findFirst({ where: scopeWhere, orderBy: { rank: 'asc' } });
    const last = () => tx.boardIssue.findFirst({ where: scopeWhere, orderBy: { rank: 'desc' } });

    let newRank: Decimal;

    if (relative.type === 'top') {
      const firstIssue = await first();
      const rank = firstIssue ? ranker.before(firstIssue.rank) : ranker.first();
      newRank = new Decimal(rank);
    } else if (relative.type === 'bottom') {
      const lastIssue = await last();
      const rank = lastIssue ? ranker.after(lastIssue.rank) : ranker.first();
      newRank = new Decimal(rank);
    } else if (relative.type === 'after') {
      if (relative.refId === params.issueId) return src;

      const ref = await tx.boardIssue.findFirst({
        where: {
          boardId: params.boardId,
          issueId: relative.refId,
          issue: { statusId: { in: toStatusIds } },
        },
      });
      if (!ref) throw new Error('Reference issue is not in destination column');

      const afterIssue = await tx.boardIssue.findFirst({
        where: { ...scopeWhere, rank: { gt: ref.rank } },
        orderBy: { rank: 'asc' },
      });

      const rank = afterIssue ? ranker.between(ref.rank, afterIssue.rank) : ranker.prev(ref.rank);

      newRank = new Decimal(rank);
    } else if (relative.type === 'before') {
      if (relative.refId === params.issueId) return src; // no-op

      const ref = await tx.boardIssue.findFirst({
        where: {
          boardId: params.boardId,
          issueId: relative.refId,
          issue: { statusId: { in: toStatusIds } },
        },
      });
      if (!ref) throw new Error('Reference issue is not in destination column');

      const before = await tx.boardIssue.findFirst({
        where: { ...scopeWhere, rank: { lt: ref.rank } },
        orderBy: { rank: 'desc' },
      });

      const rank = before ? ranker.between(before.rank, ref.rank) : ranker.before(ref.rank);
      newRank = new Decimal(rank);
    } else {
      throw new Error('Invalid relative type');
    }

    // Decide next statusId when moving across columns
    const nextStatusId =
      srcStatusId && toStatusIds.includes(srcStatusId) ? srcStatusId : toStatusIds[0];

    // resolvedAt rule (không cần query thêm vì đã có category trong toCol)
    let resolvedAt: Date | null | undefined = undefined;
    if (nextStatusId !== srcStatusId) {
      const nextStatus = toStatuses.find((s) => s.id === nextStatusId);
      if (!nextStatus) throw new Error('Status not found');
      resolvedAt = nextStatus.category === 'DONE' ? new Date() : null;
    }

    return tx.boardIssue.update({
      where: { issueId: params.issueId },
      data: {
        rank: newRank,
        ...(nextStatusId !== srcStatusId
          ? {
              issue: {
                update: {
                  statusId: nextStatusId,
                  ...(resolvedAt !== undefined ? { resolvedAt } : {}),
                },
              },
            }
          : {}),
      },
    });
  });
};

export const moveBoardIssue = async (
  params: { boardId: string; issueId: string },
  input: BoardIssueMoveInput,
) => {
  if (input.parentType === 'column') await moveInColumn(params, input);
  else {
    const parentField = input.parentType === 'sprint' ? 'sprintId' : 'statusId';
    const destRanks = await getDestRanks(params, input, parentField);

    if (input.parentType === 'status') {
      const statuId = input.to.parentId ?? undefined;
      let resolvedAt: Date | null | undefined = undefined;

      if (statuId) {
        const status = await prisma.issueStatus.findUnique({ where: { id: statuId } });
        if (!status) throw new Error('Status not found');
        const isDone = status.category === 'DONE';
        if (isDone) resolvedAt = new Date();
        else resolvedAt = null;
      }

      const updated = await prisma.boardIssue.update({
        where: { issueId: params.issueId },
        data: {
          issue: { update: { statusId: statuId, resolvedAt: resolvedAt } },
          rank: destRanks.newRank,
        },
      });
      if (!updated) throw new Error('Failed to update issue rank');
      return updated;
    } else if (input.parentType === 'sprint') {
      const updated = await prisma.boardIssue.update({
        where: { issueId: params.issueId },
        data: { sprintId: input.to.parentId, rank: destRanks.newRank },
      });
      if (!updated) throw new Error('Failed to update issue rank');
      return updated;
    }
    throw new Error('Invalid parent field');
  }

  const { issue, ...rest } = await prisma.boardIssue.findUniqueOrThrow({
    where: { issueId: params.issueId },
    include: {
      issue: {
        include: { status: true, type: true, priority: true, assignee: true, reporter: true },
      },
    },
  });
  return ZBoardIssueItem.parse({ ...issue, ...rest });
};
