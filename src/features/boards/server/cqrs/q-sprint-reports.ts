// import { addDays, differenceInCalendarDays, endOfDay, startOfDay, format } from 'date-fns';
// import Decimal from 'decimal.js';
// import { listIssuesWithDescendants } from './q-sprint-summary';

// const burndown = async (sprintId: string) => {
//   const sprint = await prisma.sprint.findUnique({
//     where: { id: sprintId },
//     include: { board: true },
//   });
//   if (!sprint) throw new Error('Sprint not found');

//   const from = sprint.startedAt ?? sprint.startAt;
//   const to = sprint.endedAt ?? sprint.endAt;

//   if (!from || !to || !sprint.committedPoints) return [];

//   // IMPORTANT:
//   // issues ở đây nên là "committed issues set" tại thời điểm from (startedAt),
//   // không phải membership hiện tại của sprint.
//   const issues = await listIssuesWithDescendants(sprintId);

//   const start = startOfDay(from);
//   const end = startOfDay(to);
//   const days = differenceInCalendarDays(end, start) + 1;

//   const committed = new Decimal(sprint.committedPoints as any);

//   const series: { date: string; remaining: number; ideal: number }[] = [];

//   for (let i = 0; i < days; i++) {
//     const day = addDays(start, i);

//     // end-of-day để tính đủ issue resolved trong ngày
//     const asOf = endOfDay(day);

//     const completedPoints = issues
//       .filter((issue) => issue.resolvedAt && issue.resolvedAt <= asOf)
//       .reduce((sum, issue) => sum.plus(issue.storyPoints || 0), new Decimal(0));

//     const remaining = Decimal.max(committed.minus(completedPoints), 0).toNumber();

//     // Ideal về 0 ở ngày cuối
//     let ideal: Decimal;
//     if (days <= 1) ideal = new Decimal(0);
//     else ideal = Decimal.max(committed.mul(new Decimal(1).minus(new Decimal(i).div(days - 1))), 0);

//     series.push({
//       date: format(day, 'yyyy-MM-dd'),
//       remaining,
//       ideal: ideal.toNumber(),
//     });
//   }

//   return series;
// };
