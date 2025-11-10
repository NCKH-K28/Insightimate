 
/* eslint-disable @typescript-eslint/no-unused-vars */

import { openfgaClient } from '@/lib/authz/openfga';
import { executeTransaction, prisma } from '@/lib/prisma';
import { s3 } from '@/lib/s3';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Prisma } from '@prisma/client';
import z from 'zod';
import { genDataSourceId } from '../../utils/id-generator';
import { SourceCreateInput, ZSourceListInput } from '@/contracts/agents';

// ========================== Service Methods ==========================
export const projectToSource = (project: { id: string; name: string; avatar?: string | null }) => ({
  label: project.name,
  value: project.id,
  iconURL: project.avatar,
});

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

  return await prisma.dataSource.create({
    data: {
      id: genDataSourceId(),
      agentId: input.agentId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      snapshot: projectToSource(p),
      status: 'PENDING',
    },
  });
};

export const removeSource = async (sourceId: string, context: SourceContext) => {
  return executeTransaction(prisma, async (tx) => {
    const source = await tx.dataSource.delete({ where: { id: sourceId } });
    if (!source) throw new Error('Source not found');
    if (source.sourceType === 'FILE') {
      const fileRef = await tx.fileReference.delete({ where: { id: source.sourceId } });
      if (!fileRef) throw new Error('File not found');
      await s3.send(new DeleteObjectCommand({ Bucket: 'ai-files', Key: fileRef.key }));
    }

    return source;
  });
};

export const ZSourceItem = z.object({
  id: z.string(),
  agentId: z.string(),
  sourceType: z.enum(['PROJECT', 'FILE']),
  sourceId: z.string(),
  status: z.enum(['PENDING', 'PROCESSING', 'READY', 'FAILED']),
  snapshot: z
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

const listSources = async (
  input: SourceListInput,
  context: SourceContext,
): Promise<SourceListOutput> => {
  const agentId = input.filter?.agentId;

  const whereClause: Prisma.DataSourceWhereInput & {
    AND: Prisma.DataSourceWhereInput[];
  } = {
    agentId,
    snapshot: { not: Prisma.JsonNull },
    AND: [],
  };

  if (input.filter?.q) {
    whereClause.AND = [
      ...whereClause.AND,
      { snapshot: { path: ['label'], mode: 'insensitive', string_contains: input.filter.q } },
    ];
  }

  const sources = await prisma.dataSource.findMany({ where: whereClause });

  return ZSourceListOutput.parse({ data: sources });
};

export const sourceService = {
  list: listSources,
  create: createSource,
  remove: removeSource,
};
