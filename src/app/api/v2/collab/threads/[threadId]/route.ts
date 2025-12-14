import { compose } from '@/lib/http/api-compose';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type Params = { threadId: string };
export const GET = compose<Params>(async (req) => {
  const { threadId } = req.params;

  const thread = await prisma.commentThread.findUnique({
    where: { id: threadId },
    include: { comments: { orderBy: { createdAt: 'asc' } } },
  });
  if (!thread) return new Response(null, { status: 404 });

  return NextResponse.json(thread);
});
