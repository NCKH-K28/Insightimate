import { prisma } from '@/lib/prisma/client';
import { format, startOfDay, addDays, endOfDay, differenceInCalendarDays } from 'date-fns';
import Decimal from 'decimal.js';
import { listIssuesWithDescendants, summary } from './cqrs/q-sprint-summary';

const listIssues = async (sprintId: string) => {
  const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
  if (!sprint) throw new Error('Sprint not found');

  const issues = await prisma.boardIssue
    .findMany({ where: { sprintId }, include: { issue: true } })
    .then((boardIssues) =>
      boardIssues.map(({ sprintId, boardId, issue }) => ({ ...issue, sprintId, boardId })),
    );

  const result = {
    data: issues,
    meta: { total: issues.length },
  };

  return result;
};

const burndown = async (sprintId: string) => {
  const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
  if (!sprint) throw new Error('Sprint not found');

  const { startAt, endAt } = sprint;
  if (!startAt || !endAt) return [];

  const issues = await listIssuesWithDescendants(sprintId);

  const totalPoints = issues
    .filter((i) => typeof i.storyPoints === 'number')
    .reduce((sum, i) => sum.plus(i.storyPoints ?? 0), new Decimal(0));

  const startDay = startOfDay(startAt);
  const endDay = startOfDay(endAt);

  const days = differenceInCalendarDays(endDay, startDay) + 1;

  const denom = Math.max(days - 1, 1);
  const burndownData: { date: string; remaining: number; ideal: number }[] = [];

  for (let day = 0; day < days; day++) {
    const cutoff = endOfDay(addDays(startDay, day));
    const date = format(cutoff, 'yyyy-MM-dd');

    const completed = issues
      .filter((i) => i.resolvedAt && i.resolvedAt <= cutoff)
      .reduce((sum, i) => sum.plus(i.storyPoints ?? 0), new Decimal(0));

    const remaining = totalPoints.minus(completed).toNumber();
    const ideal = totalPoints.minus(totalPoints.dividedBy(denom).times(day)).toNumber();

    burndownData.push({ date, remaining, ideal });
  }

  return {
    type: 'burndown',
    unit: 'points',
    interval: 'day',
    inclusiveEnd: true,
    cutoff: 'endOfDay',
    series: burndownData,
  };
};

const burnup = async (sprintId: string) => {
  const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
  if (!sprint) throw new Error('Sprint not found');

  const { startAt, endAt } = sprint;
  if (!startAt || !endAt) return [];

  const issues = await listIssuesWithDescendants(sprintId);

  const totalPoints = issues
    .filter((i) => typeof i.storyPoints === 'number')
    .reduce((sum, i) => sum.plus(i.storyPoints ?? 0), new Decimal(0));

  const startDay = startOfDay(startAt);
  const endDay = startOfDay(endAt);
  const days = differenceInCalendarDays(endDay, startDay) + 1;

  const burnupData: { date: string; completed: number; scope: number }[] = [];

  for (let day = 0; day < days; day++) {
    const cutoff = endOfDay(addDays(startDay, day));
    const date = format(cutoff, 'yyyy-MM-dd');

    const completed = issues
      .filter((i) => i.resolvedAt && i.resolvedAt <= cutoff)
      .reduce((sum, i) => sum.plus(i.storyPoints ?? 0), new Decimal(0))
      .toNumber();

    burnupData.push({ date, completed, scope: totalPoints.toNumber() });
  }

  return {
    type: 'burnup',
    unit: 'points',
    interval: 'day',
    inclusiveEnd: true,
    cutoff: 'endOfDay',
    series: burnupData,
  };
};

export const sprintService = {
  listIssues,
  burndown,
  burnup,
  summary,
};
