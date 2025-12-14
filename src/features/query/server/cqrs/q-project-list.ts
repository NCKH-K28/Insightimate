import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const ZProjectListInput = z.object({
  filter: z
    .object({
      ids: z.array(z.string()).optional().describe('List of project IDs to filter projects'),
      q: z.string().optional().describe('Search query for project names'),
    })
    .optional(),
});

export const ZProjectItem = z.object({
  id: z.string(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  avatar: z.string().nullable(),
});

export const ZProjectListOutput = z.object({ data: z.array(ZProjectItem) });

export type ProjectListInput = z.infer<typeof ZProjectListInput>;
export type ProjectListOutput = z.infer<typeof ZProjectListOutput>;

export const listProjects = async (input: ProjectListInput, _context: { actorId: string }) => {
  const where: any = {};

  if (input.filter?.q) {
    where.OR = [
      { name: { contains: input.filter.q, mode: 'insensitive' } },
      { description: { contains: input.filter.q, mode: 'insensitive' } },
    ];
  }

  if (input.filter?.ids) {
    where.id = { in: input.filter.ids };
  }

  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  return ZProjectListOutput.parse({ data: projects });
};
