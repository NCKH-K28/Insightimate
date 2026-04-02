// pages/api/comments/[commentId].ts
import type { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '../socket';
import { prisma } from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/authn/authenticated-for-page-route';

const authorSelect = { id: true, name: true, avatar: true } as const;

const PATCH = async (req: NextApiRequest, res: NextApiResponseServerIO) => {
  const { user } = await getAuthFromRequest(req as any);
  const commentId = req.query.commentId as string;

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  if (comment.authorId !== user.id) return res.status(403).json({ error: 'Forbidden' });

  const { content } = req.body;
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'content is required' });
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content },
    include: { author: { select: authorSelect } },
  });

  return res.status(200).json({ data: updated });
};

const DELETE = async (req: NextApiRequest, res: NextApiResponseServerIO) => {
  const { user } = await getAuthFromRequest(req as any);
  const commentId = req.query.commentId as string;

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  if (comment.authorId !== user.id) return res.status(403).json({ error: 'Forbidden' });

  await prisma.comment.delete({ where: { id: commentId } });
  return res.status(200).json({ success: true });
};

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  try {
    if (req.method === 'PATCH') return await PATCH(req, res);
    if (req.method === 'DELETE') return await DELETE(req, res);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[comments/:commentId] Error:', err?.message ?? err, err?.stack);
    const status = err?.statusCode ?? err?.status ?? 500;
    return res.status(status).json({ error: err?.message ?? 'Internal server error' });
  }
}
