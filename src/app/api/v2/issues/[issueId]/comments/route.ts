import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createId } from '@paralleldrive/cuid2';

export async function GET(req: NextRequest, { params }: { params: { issueId: string } }) {
  try {
    const comments = await prisma.comment.findMany({
      where: {
        issueId: params.issueId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return Response.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return new Response('Error fetching comments', { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { issueId: string } }) {
  try {
    const { content, userId, userName } = await req.json();

    const comment = await prisma.comment.create({
      data: {
        id: createId(),
        content,
        userId,
        userName,
        issueId: params.issueId,
      },
    });

    return Response.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return new Response('Error creating comment', { status: 500 });
  }
}
