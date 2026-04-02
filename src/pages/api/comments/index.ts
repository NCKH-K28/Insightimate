// pages/api/comments.ts
import type { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '../socket';
import { prisma } from '@/lib/prisma';
import {
  CommentThread,
  ZCommentList,
  ZCommentListQuery,
  ZCommentSendInput,
} from '@/contracts/collab/collab';
import { getAuthFromRequest } from '@/lib/authn/authenticated-for-page-route';

const authorSelect = { id: true, name: true, avatar: true } as const;

const GET = async (req: NextApiRequest, res: NextApiResponseServerIO) => {
  const query = req.query;
  const parseResult = ZCommentListQuery.safeParse(query);
  if (!parseResult.success) {
    return res
      .status(400)
      .json({ error: 'Invalid query parameters', details: parseResult.error.issues });
  }
  const input = parseResult.data;

  let thread: CommentThread | null = null;
  if ('threadId' in input) {
    thread = await prisma.commentThread.findUnique({ where: { id: input.threadId } });
  } else {
    thread = await prisma.commentThread.upsert({
      where: { targetType_targetId: { targetId: input.targetId, targetType: input.targetType } },
      create: { targetId: input.targetId, targetType: input.targetType },
      update: {},
    });
  }
  if (!thread) return res.status(404).json({ error: 'Comment thread not found' });

  const comments = await prisma.comment.findMany({
    where: { threadId: thread.id },
    include: { author: { select: authorSelect } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });

  const result = ZCommentList.parse({ data: comments, meta: { threadId: thread.id } });
  return res.status(200).json(result);
};

const POST = async (req: NextApiRequest, res: NextApiResponseServerIO) => {
  const { user } = await getAuthFromRequest(req as any);

  const parsed = ZCommentSendInput.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(', ');
    return res.status(400).json({ error: msg });
  }

  const input = parsed.data;
  const authorId = user.id;

  const comment = await prisma.comment.create({
    data: { ...input, authorId },
    include: { author: { select: authorSelect } },
  });

  const validComment = ZCommentList.shape.data.element.parse(comment);
  res.socket.server.io?.to(`thread:${input.threadId}`).emit('comment:new', validComment);

  return res.status(201).json({ data: validComment });
};

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  try {
    await getAuthFromRequest(req as any);

    if (req.method === 'GET') return await GET(req, res);
    if (req.method === 'POST') return await POST(req, res);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[comments] Error:', err?.message ?? err, err?.stack);
    const status = err?.statusCode ?? err?.status ?? 500;
    return res.status(status).json({ error: err?.message ?? 'Internal server error' });
  }
}
