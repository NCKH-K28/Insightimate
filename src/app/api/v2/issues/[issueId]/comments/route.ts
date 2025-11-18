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

  return Response.json(comment, { status: 201 });
});
