import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const ZSprintFilter = z.object({
  q: z.string().optional().describe('Search query for sprint names'),
  boardIds: z.array(z.string()).optional().describe('List of board IDs to filter sprints'),
  status: z.enum(['active', 'completed']).optional().describe('Filter sprints by status'),
});

export const ZSprintListInput = z.object({ filter: ZSprintFilter.optional() });
export const ZSprintItem = z.object({
  id: z.string(),
  boardId: z.string(),
  name: z.string(),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  isCompleted: z.boolean(),
});

export const ZSprintListOutput = z.object({ data: z.array(ZSprintItem) });

export type SprintListInput = z.infer<typeof ZSprintListInput>;
export type SprintListOutput = z.infer<typeof ZSprintListOutput>;

export const listSprints = async (input: SprintListInput, context: { actorId: string }) => {
  const data = await prisma.sprint.findMany({});
  return { data };
};
