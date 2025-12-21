import { prisma } from '@/lib/prisma';
import z from 'zod';
import merge from 'lodash/merge';
import { Prisma } from '@prisma/client';
import { ZProjectItem } from '@/contracts/projects';

type Context = { actorId: string };

export const ZGetProjectInput = z.object({ id: z.string() });
const ZField = z.object({ id: z.string(), name: z.string(), description: z.string().nullish() });
export const ZGetProjectOutput = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string(),
  description: z.string().nullish(),
  boardId: z.string(),
  workspaceId: z.string(),
  leadId: z.string(),
  types: z.array(ZField),
  priorities: z.array(ZField),
  statuses: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullish(),
      category: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
    }),
  ),
});

export const getProject = async ({ id }: z.infer<typeof ZGetProjectInput>, _context: Context) => {
  const proj = await prisma.project.findUnique({
    where: { id },
    include: { types: true, priorities: true, statuses: true, board: true },
  });
  if (!proj) throw new Error('Project not found');
  return ZGetProjectOutput.parse({ ...proj, boardId: proj.board?.id });
};

export const ZListProjectsInput = z.object({
  q: z.string().optional(),
  ids: z.array(z.string()).optional(),
  workspaceIds: z.array(z.string()).optional(),
  leadIds: z.array(z.string()).optional(),
  pagination: z.object({
    page: z.number().min(1),
    limit: z.number().min(10).max(100),
    sort: z.enum(['asc', 'desc']),
    sortBy: z.enum(['name', 'key', 'createdAt', 'updatedAt']),
  }),
});
export const ZListProjectsOutput = z.object({
  data: z.array(ZProjectItem),
  meta: z.object({ total: z.number(), page: z.number(), limit: z.number() }),
});

export const listProjects = async (
  input: z.infer<typeof ZListProjectsInput>,
  _context: Context,
) => {
  const { q, ids, workspaceIds, leadIds, pagination } = input;
  const { page, limit, sort, sortBy } = pagination;

  const where: Prisma.ProjectWhereInput = {};

  if (q) {
    merge<Prisma.ProjectWhereInput, Prisma.ProjectWhereInput>(where, {
      OR: [
        { key: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  merge<Prisma.ProjectWhereInput, Prisma.ProjectWhereInput>(where, {
    ...(ids && { id: { in: ids } }),
    ...(workspaceIds && { workspaceId: { in: workspaceIds } }),
    ...(leadIds && { leadId: { in: leadIds } }),
  });

  const projects = await prisma.project.findMany({
    where,
    include: { types: true, priorities: true, statuses: true, board: true },
    take: limit,
    skip: (page - 1) * limit,
    orderBy: { [sortBy]: sort },
  });

  const total = await prisma.project.count({ where });
  return ZListProjectsOutput.parse({ data: projects, meta: { total, page, limit } });
};
