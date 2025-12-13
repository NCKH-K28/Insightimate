import { sprintService } from '@/features/boards/server/sprint-service';
import { compose } from '@/lib/http/api-compose';
import { prisma } from '@/lib/prisma';
import { Sprint } from '@prisma/client';
import { format } from 'date-fns';
import Decimal from 'decimal.js';
import { NextResponse } from 'next/server';

export const GET = compose<{ sprintId: string }>(async (res) => {
  const { sprintId } = res.params;

  //log
  console.log('Fetching reports for sprintId:', sprintId);
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: { boardIssues: true },
  });

  if (!sprint) throw new Response('Sprint not found', { status: 404 });

  const burndown = await sprintService.burndown(sprintId);

  const result = { burndown: burndown };
  return NextResponse.json(result);
});

// log
// console.log(`Found ${issues.length} issues for sprintId:`, sprintId);

// const sprintWithIssues: Sprint & { issues: Issue[] } = {
//   ...sprint,
//   issues,
// };

// const burndownChart: ChartSeries[] = [
//   {
//     label: 'Actual burndown',
//     points: buildBurndownSeries(sprintWithIssues),
//   },
// ];

// const burnupChart: ChartSeries[] = [
//   {
//     label: 'Actual burnup',
//     points: buildBurnupSeries(sprintWithIssues),
//   },
// ];

// const velocityChart: ChartSeries[] = [
//   {
//     label: 'Velocity',
//     points: buildVelocitySeries(sprintWithIssues),
//   },
// ];

// const data: SprintReports = {
//   burndownChart,
//   burnupChart,
//   velocityChart,
// };

// return NextResponse.json({ data });
// });

// ==== Helpers =====================================================

// const getSprintDates = (sprint: Sprint): { start: Date; end: Date } | null => {
//   const anySprint = sprint as any;
//   const start: Date | undefined = anySprint.startDate;
//   const end: Date | undefined = anySprint.endDate;

//   if (!start || !end) return null;

//   const s = new Date(start);
//   const e = new Date(end);
//   s.setHours(0, 0, 0, 0);
//   e.setHours(0, 0, 0, 0);

//   if (s > e) return null;
//   return { start: s, end: e };
// };

// const getDaysInRange = (start: Date, end: Date): Date[] => {
//   const days: Date[] = [];
//   const cur = new Date(start);

//   while (cur <= end) {
//     days.push(new Date(cur));
//     cur.setDate(cur.getDate() + 1);
//   }

//   return days;
// };

// const getIssuePoints = (issue: Issue): Decimal => {
//   const anyIssue = issue as any;
//   const raw = anyIssue.storyPoints ?? anyIssue.points ?? anyIssue.estimate ?? 1;

//   try {
//     return new Decimal(raw ?? 0);
//   } catch {
//     return new Decimal(0);
//   }
// };

// const getIssueCompletedAt = (issue: Issue): Date | null => {
//   const anyIssue = issue as any;
//   const completed: Date | null =
//     anyIssue.completedAt ?? anyIssue.resolvedAt ?? anyIssue.closedAt ?? null;

//   if (!completed) return null;
//   const d = new Date(completed);
//   d.setHours(0, 0, 0, 0);
//   return d;
// };

// const getTotalPoints = (issues: Issue[]): Decimal => {
//   return issues.reduce((sum, issue) => sum.plus(getIssuePoints(issue)), new Decimal(0));
// };

// const getCompletedPointsUntil = (issues: Issue[], day: Date): Decimal => {
//   return issues.reduce((sum, issue) => {
//     const completedAt = getIssueCompletedAt(issue);
//     if (completedAt && completedAt <= day) {
//       return sum.plus(getIssuePoints(issue));
//     }
//     return sum;
//   }, new Decimal(0));
// };

// // ==== Chart builders ==============================================

// type ChartPoint = { x: string; y: number };

// type ChartSeries = {
//   label: string;
//   points: ChartPoint[];
// };

// const buildBurndownSeries = (sprint: Sprint & { issues: Issue[] }): ChartPoint[] => {
//   const range = getSprintDates(sprint);
//   if (!range) return [];

//   const { start, end } = range;
//   const days = getDaysInRange(start, end);
//   const totalPoints = getTotalPoints(sprint.issues);

//   return days.map((day) => {
//     const completed = getCompletedPointsUntil(sprint.issues, day);
//     const remaining = Decimal.max(new Decimal(0), totalPoints.minus(completed));

//     return {
//       x: format(day, 'yyyy-MM-dd'),
//       y: remaining.toNumber(),
//     };
//   });
// };

// const buildBurnupSeries = (sprint: Sprint & { issues: Issue[] }): ChartPoint[] => {
//   const range = getSprintDates(sprint);
//   if (!range) return [];

//   const { start, end } = range;
//   const days = getDaysInRange(start, end);

//   return days.map((day) => {
//     const completed = getCompletedPointsUntil(sprint.issues, day);

//     return {
//       x: format(day, 'yyyy-MM-dd'),
//       y: completed.toNumber(),
//     };
//   });
// };

// const buildVelocitySeries = (sprint: Sprint & { issues: Issue[] }): ChartPoint[] => {
//   const range = getSprintDates(sprint);
//   if (!range) return [];

//   const { start, end } = range;

//   const completedTotal = sprint.issues.reduce((sum, issue) => {
//     const completedAt = getIssueCompletedAt(issue);
//     if (!completedAt) return sum;
//     if (completedAt < start || completedAt > end) return sum;

//     return sum.plus(getIssuePoints(issue));
//   }, new Decimal(0));

//   return [
//     {
//       x: format(end, 'yyyy-MM-dd'),
//       y: completedTotal.toNumber(),
//     },
//   ];
// };
