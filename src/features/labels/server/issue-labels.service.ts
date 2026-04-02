import { prisma } from '@/lib/prisma';
import { ensureCan } from '@/features/organization/utils/authz';
import { ZIssueLabel } from '@/contracts/labels';

export type IssueLabelServiceContext = { actorId: string; orgId: string; projectId: string };

const list = async (issueId: string, context: IssueLabelServiceContext) => {
  await ensureCan('read', { kind: 'org', id: context.orgId, attr: { orgId: context.orgId } }, { actorId: context.actorId });

  const issueLabels = await prisma.issueLabel.findMany({
    where: { issueId },
    include: { label: true },
  });

  const data = issueLabels.map((il) => ZIssueLabel.parse(il));
  return { data, meta: { total: data.length } };
};

const attach = async (issueId: string, labelId: string, context: IssueLabelServiceContext) => {
  await ensureCan('read', { kind: 'org', id: context.orgId, attr: { orgId: context.orgId } }, { actorId: context.actorId });

  // Verify label belongs to the same project
  const label = await prisma.label.findUnique({
    where: { id: labelId, projectId: context.projectId },
  });
  if (!label) throw new Error('Label not found in this project');

  // Verify issue belongs to the same project
  const issue = await prisma.issue.findFirst({
    where: { id: issueId, projectId: context.projectId },
  });
  if (!issue) throw new Error('Issue not found in this project');

  const issueLabel = await prisma.issueLabel.create({
    data: { issueId, labelId },
    include: { label: true },
  });

  return ZIssueLabel.parse(issueLabel);
};

const detach = async (issueId: string, labelId: string, context: IssueLabelServiceContext) => {
  await ensureCan('read', { kind: 'org', id: context.orgId, attr: { orgId: context.orgId } }, { actorId: context.actorId });

  const existing = await prisma.issueLabel.findUnique({
    where: { issueId_labelId: { issueId, labelId } },
  });
  if (!existing) throw new Error('Label is not attached to this issue');

  await prisma.issueLabel.delete({
    where: { issueId_labelId: { issueId, labelId } },
  });

  return { issueId, labelId };
};

export const issueLabelsService = {
  list,
  attach,
  detach,
};
