import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const ZStatusFilter = z.object({
  q: z.string().optional().describe('Search query for status names'),
  ids: z.array(z.string()).optional().describe('List of status IDs to filter'),
  category: z
    .enum(['TODO', 'IN_PROGRESS', 'DONE'])
    .optional()
    .describe('Filter statuses by category'),
  projectIds: z.array(z.string()).optional().describe('List of project IDs to filter statuses'),
});

export const ZStatusListInput = z.object({ filter: ZStatusFilter.optional() });
export const ZStatusItem = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  category: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
});

export const ZStatusListOutput = z.object({ data: z.array(ZStatusItem) });

export type StatusListInput = z.infer<typeof ZStatusListInput>;
export type StatusListOutput = z.infer<typeof ZStatusListOutput>;

const buildWhereClause = (input: StatusListInput, context?: { actorId: string }) => {
  const { filter } = input;

  const whereClause: Prisma.IssueStatusWhereInput & {
    AND: Prisma.IssueStatusWhereInput[];
  } = { AND: [] };

  if (filter?.ids) {
    whereClause.AND.push({ id: { in: filter.ids } });
  }

  if (filter?.q) {
    whereClause.AND.push({
      OR: [
        { name: { contains: filter.q, mode: 'insensitive' } },
        { description: { contains: filter.q, mode: 'insensitive' } },
      ],
    });
  }

  if (filter?.category) {
    whereClause.AND.push({ category: filter.category });
  }

  if (filter?.projectIds) {
    whereClause.AND.push({ projectId: { in: filter.projectIds } });
  }

  return whereClause;
};

export const listStatuses = async (input: StatusListInput, context: { actorId: string }) => {
  const whereClause = buildWhereClause(input, context);
  const statuses = await prisma.issueStatus.findMany({ where: whereClause });
  return { data: statuses };
};
