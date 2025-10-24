import { openfgaClient } from '@/lib/authz/openfga';
import { prisma } from '@/lib/prisma';
import { createId } from '@paralleldrive/cuid2';
import z from 'zod';

export const ZSourceCreateInput = z.object({
  agentId: z.string(),
  sourceType: z.enum(['PROJECT']),
  sourceId: z.string(),
});

export const ZSourceUpdateInput = z.object({
  agentId: z.string().optional(),
  sourceType: z.enum(['PROJECT']).optional(),
  sourceId: z.string().optional(),
});

export type SourceCreateInput = z.infer<typeof ZSourceCreateInput>;
export type SourceUpdateInput = z.infer<typeof ZSourceUpdateInput>;

// ========================== Service Methods ==========================

const genAgentSourceId = () => `as_${createId()}`;

type SourceContext = { actorId: string };
export const createSource = async (input: SourceCreateInput, context: SourceContext) => {
  const check = await openfgaClient.check({
    user: context.actorId,
    relation: 'can_view',
    object: `project:${input.sourceId}`,
  });
  if (!check.allowed) throw new Error('Permission denied');

  return await prisma.agentSource.create({
    data: {
      id: genAgentSourceId(),
      agentId: input.agentId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
    },
  });
};

export const removeSource = async (sourceId: string, context: SourceContext) => {
  const source = await prisma.agentSource.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error('Source not found');

  const check = await openfgaClient.check({
    user: context.actorId,
    relation: 'can_view',
    object: `project:${source.sourceId}`,
  });
  if (!check.allowed) throw new Error('Permission denied');

  return await prisma.agentSource.delete({ where: { id: sourceId } });
};

type ListSourcesQuery = { filter: { agentId: string; q?: string } };
export const listSources = async (query: ListSourcesQuery, context: SourceContext) => {
  const agentId = query.filter.agentId;
  const sources = await prisma.agentSource.findMany({ where: { agentId } });
  return { data: sources };
};

export const sourceService = {
  list: listSources,
  create: createSource,
  remove: removeSource,
};
