import { Hono } from 'hono';
import { authenticatedGuard, getUserAndThrow } from '@/lib/auth';
import { httpExceptionFilterHono } from '@/lib/http/filters';
import { handle } from 'hono/vercel';
import { zValidator } from '@hono/zod-validator';
import { ZCommentListQuery, ZCommentSendInput, ZCommentList } from '@/contracts/collab/collab';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const commentsHono = new Hono().basePath('/api/v3/comments');
commentsHono.use(authenticatedGuard);
commentsHono.onError(httpExceptionFilterHono);

const authorSelect = { id: true, name: true, avatar: true } as const;

commentsHono.get('/', zValidator('query', ZCommentListQuery), async (c) => {
  const query = c.req.valid('query');

  let thread = null;
  if ('threadId' in query) {
    thread = await prisma.commentThread.findUnique({ where: { id: query.threadId } });
  } else {
    thread = await prisma.commentThread.upsert({
      where: { targetType_targetId: { targetId: query.targetId, targetType: query.targetType } },
      create: { targetId: query.targetId, targetType: query.targetType },
      update: {},
    });
  }
  
  if (!thread) {
    return c.json({ error: 'Comment thread not found' }, 404);
  }

  const comments = await prisma.comment.findMany({
    where: { threadId: thread.id },
    include: { author: { select: authorSelect } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });

  const result = ZCommentList.parse({ data: comments, meta: { threadId: thread.id } });
  return c.json(result);
});

commentsHono.post('/', zValidator('json', ZCommentSendInput), async (c) => {
  const user = await getUserAndThrow(c);
  const input = c.req.valid('json');
  const authorId = user.id;

  const comment = await prisma.comment.create({
    data: { ...input, authorId },
    include: { author: { select: authorSelect } },
  });

  const validComment = ZCommentList.shape.data.element.parse(comment);

  // Emit socket event internally via the pages API bridge
  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000';
    await fetch(`${origin}/api/internal/socket-emit`, {
      method: 'POST',
      body: JSON.stringify({
        room: `thread:${input.threadId}`,
        event: 'comment:new',
        payload: validComment,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Socket emit failed', error);
  }

  return c.json({ data: validComment }, 201);
});

commentsHono.patch('/:id', zValidator('json', z.object({ content: z.string() })), async (c) => {
  const user = await getUserAndThrow(c);
  const { id } = c.req.param();
  const { content } = c.req.valid('json');

  const existing = await prisma.comment.findUnique({ where: { id } });
  if (!existing) return c.json({ error: 'Not found' }, 404);
  if (existing.authorId !== user.id) return c.json({ error: 'Forbidden' }, 403);

  const updated = await prisma.comment.update({
    where: { id },
    data: { content },
    include: { author: { select: authorSelect } },
  });

  return c.json({ data: ZCommentList.shape.data.element.parse(updated) });
});

commentsHono.delete('/:id', async (c) => {
  const user = await getUserAndThrow(c);
  const { id } = c.req.param();

  const existing = await prisma.comment.findUnique({ where: { id } });
  if (!existing) return c.json({ error: 'Not found' }, 404);
  if (existing.authorId !== user.id) return c.json({ error: 'Forbidden' }, 403);

  await prisma.comment.delete({ where: { id } });
  return c.json({ success: true });
});

export const GET = handle(commentsHono);
export const POST = handle(commentsHono);
export const PATCH = handle(commentsHono);
export const DELETE = handle(commentsHono);
