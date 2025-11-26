import { prisma } from '@/lib/prisma';
import { createId } from '@paralleldrive/cuid2';
import { compose } from '@/lib/http/api-compose';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ issueId: string }> }) {
  try {
    const { issueId } = await params;

    const comments = await prisma.comment.findMany({
      where: { issueId },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return new Response('Error fetching comments', { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ issueId: string }> }) {
  try {
    const { content, userId, userName, parentId } = await req.json();
    const { issueId } = await params;

    console.log('📝 Creating comment:', { 
      issueId, 
      userId, 
      userName, 
      parentId: parentId || null,
      content: content?.substring(0, 50) + '...'
    });

    const comment = await prisma.comment.create({
      data: {
        id: createId(),
        content,
        userId,
        userName,
        issueId,
        parentId: parentId || null,   // Gán parentId (nếu không có thì để null)
      },
    });

    console.log('✅ Comment created successfully:', comment.id);
    return Response.json(comment, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating comment:', error);
    return new Response('Error creating comment', { status: 500 });
  }
}

