import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import z from 'zod';

export const ZSourceListInput = z.object({
  filter: z.object({
    agentId: z.string().describe('Agent ID to filter sources by'),
    q: z.string().optional().describe('Search term for filtering sources'),
  }),
});

export const ZSourceItem = z.object({
  id: z.string(),
  agentId: z.string(),
  sourceType: z.enum(['PROJECT']),
  sourceId: z.string(),
  status: z.enum(['PENDING', 'PROCESSING', 'READY', 'FAILED']),
  source: z
    .object({
      label: z.string(),
      value: z.string(),
      iconURL: z.string().optional(),
      url: z.string().optional(),
      meta: z.object({ boardId: z.string().optional() }).optional(),
    })
    .optional(),
});

export const ZSourceListOutput = z.object({ data: z.array(ZSourceItem) });

export type SourceListInput = z.infer<typeof ZSourceListInput>;
export type SourceListOutput = z.infer<typeof ZSourceListOutput>;
export type SourceContext = { actorId: string };

export const listSources = async (
  input: SourceListInput,
  context: SourceContext,
): Promise<SourceListOutput> => {
  const agentId = input.filter.agentId;

  const whereClause: Prisma.AgentSourceWhereInput & {
    AND: Prisma.AgentSourceWhereInput[];
  } = {
    agentId,
    source: { not: Prisma.JsonNull },
    AND: [],
  };

  if (input.filter.q) {
    whereClause.AND = [
      ...whereClause.AND,
      { source: { path: ['label'], mode: 'insensitive', string_contains: input.filter.q } },
    ];
  }

  const sources = await prisma.agentSource.findMany({ where: whereClause });
  // log

  const projectIds = sources.filter((s) => s.sourceType === 'PROJECT').map((s) => s.sourceId);
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: { id: true, name: true, avatar: true, board: true },
  });
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const data = sources.map((s) => {
    if (s.sourceType === 'PROJECT') {
      const project = projectMap.get(s.sourceId);
      if (!project) return s;
      const source = {
        label: project?.name,
        value: project?.id,
        iconURL: project?.avatar,
        meta: { boardId: project?.board?.id },
      };
      return Object.assign(s, { source });
    }
    return s;
  });

  return ZSourceListOutput.parse({ data });
};
