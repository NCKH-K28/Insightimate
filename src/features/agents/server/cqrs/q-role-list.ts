import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const ZRoleFilter = z.object({
  q: z.string().optional().describe('Search query for role names'),
  ids: z.array(z.string()).optional().describe('List of role IDs to filter'),
  projectIds: z.array(z.string()).optional().describe('List of project IDs to filter roles'),
});

export const ZRoleListInput = z.object({ filter: ZRoleFilter.optional() });
export const ZRoleItem = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
});
export const ZRoleListOutput = z.object({ data: z.array(ZRoleItem) });

export type RoleListInput = z.infer<typeof ZRoleListInput>;
export type RoleListOutput = z.infer<typeof ZRoleListOutput>;

const buildWhereClause = (input: RoleListInput, context?: { actorId: string }) => {
  const { filter } = input;

  const whereClause: Prisma.ProjectRoleWhereInput & {
    AND: Prisma.ProjectRoleWhereInput[];
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

  if (filter?.projectIds) {
    whereClause.AND.push({ projectId: { in: filter.projectIds } });
  }

  return whereClause;
};

export const listProjectRoles = async (input: RoleListInput, context: { actorId: string }) => {
  const whereClause = buildWhereClause(input, context);
  const roles = await prisma.projectRole.findMany({ where: whereClause });
  return { data: roles };
};
