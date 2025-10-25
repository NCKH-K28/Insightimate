import { openfgaClient } from '@/lib/authz/openfga';
import { prisma } from '@/lib/prisma';
import { createId } from '@paralleldrive/cuid2';
import { Prisma } from '@prisma/client';
import z from 'zod';

const ZSourceType = z.enum(['PROJECT', 'FILE']);

export const ZSourceCreateInput = z.object({
  agentId: z.string(),
  sourceType: ZSourceType,
  sourceId: z.string(),
});

export const ZSourceUpdateInput = z.object({
  agentId: z.string().optional(),
  sourceType: ZSourceType.optional(),
  sourceId: z.string().optional(),
});

export type SourceCreateInput = z.infer<typeof ZSourceCreateInput>;
export type SourceUpdateInput = z.infer<typeof ZSourceUpdateInput>;

// ========================== Service Methods ==========================

const genAgentSourceId = () => `as_${createId()}`;

const checkProjectAccess = async (actorId: string, projectId: string) => {
  const check = await openfgaClient.check({
    user: `user:${actorId}`,
    relation: 'can_view',
    object: `project:${projectId}`,
  });
  return check.allowed;
};

type SourceContext = { actorId: string };
export const createSource = async (input: SourceCreateInput, context: SourceContext) => {
  const hasAccess = await checkProjectAccess(context.actorId, input.sourceId);
  if (!hasAccess) throw new Error('Permission denied to add this project as source');

  // FIXME: call api
  const p = await prisma.project.findUnique({ where: { id: input.sourceId } });
  if (!p) throw new Error('Project not found');

  return await prisma.agentSource.create({
    data: {
      id: genAgentSourceId(),
      agentId: input.agentId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      source: { label: p.name, value: p.id, iconURL: p.avatar },
    },
  });
};

export const removeSource = async (sourceId: string, context: SourceContext) => {
  const source = await prisma.agentSource.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error('Source not found');
  const hasAccess = await checkProjectAccess(context.actorId, source.sourceId);
  if (!hasAccess) throw new Error('Permission denied to remove this source');

  return await prisma.agentSource.delete({ where: { id: sourceId } });
};

export const ZSourceListInput = z.object({
  filter: z.object({
    agentId: z.string().describe('Agent ID to filter sources by'),
    q: z.string().optional().describe('Search term for filtering sources'),
  }),
});

export const ZSourceItem = z.object({
  id: z.string(),
  agentId: z.string(),
  sourceType: ZSourceType,
  sourceId: z.string(),
  status: z.enum(['PENDING', 'PROCESSING', 'READY', 'FAILED']),
  source: z
    .object({
      label: z.string(),
      value: z.string(),
      iconURL: z.string().optional(),
      url: z.string().optional(),
    })
    .optional(),
});

export const ZSourceListOutput = z.object({ data: z.array(ZSourceItem) });

export type SourceListInput = z.infer<typeof ZSourceListInput>;
export type SourceListOutput = z.infer<typeof ZSourceListOutput>;

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
    select: { id: true, name: true, avatar: true },
  });
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const data = sources.map((s) => {
    if (s.sourceType === 'PROJECT') {
      const project = projectMap.get(s.sourceId);
      if (!project) return s;
      const source = { label: project?.name, value: project?.id, iconURL: project?.avatar };
      return Object.assign(s, { source });
    }
    return s;
  });

  return ZSourceListOutput.parse({ data });
};

export const sourceService = {
  list: listSources,
  create: createSource,
  remove: removeSource,
};
