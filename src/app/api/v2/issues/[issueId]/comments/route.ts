import { prisma } from '@/lib/prisma';
import { createId } from '@paralleldrive/cuid2';
import { compose } from '@/lib/http/api-compose';

export const GET = compose<{ issueId: string }>(async (req) => {
  const params = req.params;
  const issueId = params.issueId;

  const comments = await prisma.comment.findMany({
    where: { issueId },
    orderBy: { createdAt: 'desc' },
  });

  return Response.json(comments);
});

export const POST = compose<{ issueId: string }>(async (req) => {
  const params = req.params;
  const issueId = params.issueId;
  const { content, userId, userName } = await req.json();

  const comment = await prisma.comment.create({
    data: { id: createId(), content, userId, userName, issueId },
  });
  try {
    const issue = await prisma.issue.findUnique({ where: { id: issueId }, select: { projectId: true } });
    const project = issue ? await prisma.project.findUnique({ where: { id: issue.projectId }, select: { workspaceId: true } }) : null;
    await prisma.activity.create({
      data: {
        userId,
        workspaceId: project?.workspaceId ?? null,
        type: 'COMMENTED',
        sourceType: 'ISSUE',
        sourceId: issueId,
        context: { comment: content },
        createdBy: userName ?? userId,
      },
    });
  } catch (err) {
    console.log(err);
  }

  return Response.json(comment, { status: 201 });
});
