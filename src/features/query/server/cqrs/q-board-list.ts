import { openfgaClient } from '@/lib/auth/authz/openfga';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const ZBoardFilter = z.object({
  q: z.string().optional().describe('Search query for board names'),
  projectIds: z.array(z.string()).optional().describe('List of project IDs to filter boards'),
});

export const ZBoardListInput = z.object({ filter: ZBoardFilter.optional() });
export const ZBoardItem = z.object({
  id: z.string(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  projectId: z.string(),
});

export const ZBoardListOutput = z.object({ data: z.array(ZBoardItem) });

export type BoardListInput = z.infer<typeof ZBoardListInput>;
export type BoardListOutput = z.infer<typeof ZBoardListOutput>;

const allowedProjects = async (actorId: string): Promise<string[]> => {
  const { objects } = await openfgaClient.listObjects({
    user: `user:${actorId}`,
    relation: 'can_view',
    type: 'project',
  });
  return objects.map((obj) => obj.replace('project:', ''));
};

export const listBoards = async (input: BoardListInput, context: { actorId: string }) => {
  const allowedProjectIds = await allowedProjects(context.actorId);
  if (allowedProjectIds.length === 0) return { data: [] };

  const where: Prisma.BoardWhereInput = {};

  if (input.filter?.projectIds) {
    where.projectId = {
      in: input.filter.projectIds.filter((id) => allowedProjectIds.includes(id)),
    };
  }

  if (input.filter?.q) {
    where.name = { contains: input.filter.q, mode: 'insensitive' };
  }

  const boards = await prisma.board.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return ZBoardListOutput.parse({ data: boards });
};
