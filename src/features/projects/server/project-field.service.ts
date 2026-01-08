import { prisma } from '@/lib/prisma';
import { IssueStatusCategory } from '@prisma/client';
import groupBy from 'lodash/groupBy';

const categories: Record<IssueStatusCategory, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

export const listStatuses = async (projectId: string) => {
  const data = await prisma.issueStatus.findMany({
    where: { projectId },
    orderBy: { sequence: 'asc' },
  });

  const groupedData = groupBy(data, (item) => categories[item.category]);
  const aggregations = Object.keys(groupedData).reduce(
    (acc, key) => {
      return Object.assign(acc, { [key]: groupedData[key].length });
    },
    {} as Record<string, number>,
  );

  return {
    data,
    meta: { total: data.length },
    aggregations,
  };
};
