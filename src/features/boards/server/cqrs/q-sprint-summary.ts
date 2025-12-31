import { BreakdownItem, SprintSummary, ZSprintSummary } from '@/contracts/boards/board.query';
import { prisma } from '@/lib/prisma';
import { snakeToCamelDeep } from '@/lib/utils/db-util';
import { Issue, Prisma } from '@prisma/client';
import { format } from 'date-fns';
import Decimal from 'decimal.js';

export const sumStoryPoints = (issues: Issue[]) => {
  const sum = issues.reduce((total, issue) => {
    if (typeof issue.storyPoints === 'number') return total.plus(issue.storyPoints);
    return total;
  }, new Decimal(0));
  return sum.toNumber();
};

export const listIssuesWithDescendants = async (sprintId: string) => {
  const issues = await prisma.boardIssue.findMany({ where: { sprintId } });
  if (issues.length === 0) return [];

  const issueIds = issues.map((i) => i.issueId);
  type IssueDescendant = Issue;
  const descendants = await prisma.$queryRaw<IssueDescendant[]>(Prisma.sql`
    WITH RECURSIVE issue_tree AS (
      SELECT i.*, ARRAY[i."id"] AS path
      FROM "issues" i
      WHERE i."id" IN (${Prisma.join(issueIds)})

      UNION ALL
      SELECT c.*, p.path || c."id"
      FROM "issues" c
      JOIN issue_tree p ON c."parent_id" = p."id"
      WHERE NOT (c."id" = ANY(p.path))  -- chống cycle
    )
    SELECT DISTINCT ON ("id") * FROM issue_tree;
   `);

  // map field
  const formatted = descendants.map((descendant) => snakeToCamelDeep<IssueDescendant>(descendant));
  return formatted;
};

const totalStoryPoints = (issues: Issue[]) => {
  const totalPoints = issues
    .filter((i) => typeof i.storyPoints === 'number')
    .reduce((sum, i) => sum.plus(i.storyPoints ?? 0), new Decimal(0));
  return totalPoints;
};

const doneStoryPoints = (issues: Issue[]) => {
  const donePoints = issues
    .filter((i) => i.resolvedAt && typeof i.storyPoints === 'number')
    .reduce((sum, i) => sum.plus(i.storyPoints ?? 0), new Decimal(0));
  return donePoints;
};

const formatSprintDate = (date: Date | null | undefined): string | null => {
  return date ? format(date, 'yyyy-MM-dd') : null;
};

const typeBreakdown = (issues: Issue[], types: { id: string; name: string }[]): BreakdownItem[] => {
  const breakdown = types.map((type) => {
    const typeIssues = issues.filter((i) => i.typeId === type.id);
    const doneIssues = typeIssues.filter((i) => i.resolvedAt);
    const counts = { total: typeIssues.length, done: doneIssues.length };
    const points = {
      total: totalStoryPoints(typeIssues).toNumber(),
      done: doneStoryPoints(doneIssues).toNumber(),
    };
    return { key: type.id, display: type.name, counts, points };
  });
  return breakdown;
};

const statusBreakdown = (
  issues: Issue[],
  statuses: { id: string; name: string }[],
): BreakdownItem[] => {
  const breakdown = statuses.map((status) => {
    const statusIssues = issues.filter((i) => i.statusId === status.id);
    const doneIssues = statusIssues.filter((i) => i.resolvedAt);
    const counts = { total: statusIssues.length, done: doneIssues.length };
    const points = {
      total: totalStoryPoints(statusIssues).toNumber(),
      done: doneStoryPoints(doneIssues).toNumber(),
    };
    return { key: status.id, display: status.name, counts, points };
  });
  return breakdown;
};

const priorityBreakdown = (
  issues: Issue[],
  priorities: { id: string; name: string }[],
): BreakdownItem[] => {
  const breakdown = priorities.map((priority) => {
    const priorityIssues = issues.filter((i) => i.priorityId === priority.id);
    const doneIssues = priorityIssues.filter((i) => i.resolvedAt);
    const counts = { total: priorityIssues.length, done: doneIssues.length };
    const points = {
      total: totalStoryPoints(priorityIssues).toNumber(),
      done: doneStoryPoints(doneIssues).toNumber(),
    };
    return { key: priority.id, display: priority.name, counts, points };
  });
  return breakdown;
};

const addedAfterStart = (sprint: { id: string; startAt: Date | null }, issues: Issue[]) => {
  const startAt = sprint.startAt;
  if (!startAt) return 0;
  const count = issues.filter((i) => i.createdAt > startAt).length;
  return count;
};

export const summary = async (sprintId: string): Promise<SprintSummary> => {
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: { board: true },
  });
  if (!sprint) throw new Error('Sprint not found');
  const projectId = sprint?.board.projectId;
  if (!projectId) throw new Error('Sprint board has no project');

  const totalIssues = await prisma.boardIssue.count({ where: { sprintId } });
  const doneIssues = await prisma.boardIssue.count({
    where: { sprintId, issue: { resolvedAt: { not: null } } },
  });

  const issues = await listIssuesWithDescendants(sprintId);

  const totalPoints = totalStoryPoints(issues);
  const donePoints = doneStoryPoints(issues);

  const [types, priorities, statuses] = await Promise.all([
    prisma.issueType.findMany({ where: { projectId, hierarchy: 1 } }),
    prisma.issuePriority.findMany({ where: { projectId } }),
    prisma.issueStatus.findMany({ where: { projectId } }),
  ]);

  const breakdowns = {
    type: typeBreakdown(issues, types),
    priority: priorityBreakdown(issues, priorities),
    status: statusBreakdown(issues, statuses),
  };

  const result: SprintSummary = {
    id: sprint.id,
    name: sprint.name,
    startDate: formatSprintDate(sprint.startAt),
    endDate: formatSprintDate(sprint.endAt),
    metrics: {
      asOf: sprint.updatedAt ? format(sprint.updatedAt, 'yyyy-MM-dd') : undefined,
      counts: { total: totalIssues, done: doneIssues },
      points: { total: totalPoints.toNumber(), done: donePoints.toNumber() },
      scope: {
        addedAfterStart: addedAfterStart({ id: sprint.id, startAt: sprint.startAt }, issues),
      },
      breakdowns,
    },
  };

  return ZSprintSummary.parse(result);
};
