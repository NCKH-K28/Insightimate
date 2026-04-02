import { prisma } from '@/lib/prisma';
import { ensureCan } from '@/features/organization/utils/authz';
import type { LabelCreateInput, LabelUpdateInput } from '@/contracts/labels';
import { ZLabel } from '@/contracts/labels';

export type LabelServiceContext = { actorId: string; orgId: string; projectId: string };

const list = async (_input: unknown, context: LabelServiceContext) => {
  await ensureCan('read', { kind: 'org', id: context.orgId, attr: { orgId: context.orgId } }, { actorId: context.actorId });

  const labels = await prisma.label.findMany({
    where: { projectId: context.projectId },
    orderBy: { name: 'asc' },
  });

  const data = labels.map((l) => ZLabel.parse(l));
  return { data, meta: { total: data.length } };
};

const create = async (input: LabelCreateInput, context: LabelServiceContext) => {
  await ensureCan('read', { kind: 'org', id: context.orgId, attr: { orgId: context.orgId } }, { actorId: context.actorId });

  const label = await prisma.label.create({
    data: {
      name: input.name,
      color: input.color,
      projectId: context.projectId,
    },
  });

  return ZLabel.parse(label);
};

const update = async (labelId: string, input: LabelUpdateInput, context: LabelServiceContext) => {
  await ensureCan('read', { kind: 'org', id: context.orgId, attr: { orgId: context.orgId } }, { actorId: context.actorId });

  const existing = await prisma.label.findUnique({
    where: { id: labelId, projectId: context.projectId },
  });
  if (!existing) throw new Error('Label not found');

  const label = await prisma.label.update({
    where: { id: labelId },
    data: input,
  });

  return ZLabel.parse(label);
};

const remove = async (labelId: string, context: LabelServiceContext) => {
  await ensureCan('read', { kind: 'org', id: context.orgId, attr: { orgId: context.orgId } }, { actorId: context.actorId });

  const existing = await prisma.label.findUnique({
    where: { id: labelId, projectId: context.projectId },
  });
  if (!existing) throw new Error('Label not found');

  await prisma.label.delete({ where: { id: labelId } });
  return { id: labelId };
};

export const labelsService = {
  list,
  create,
  update,
  remove,
};
