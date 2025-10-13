import { httpExceptionFilter } from '@/lib/http/filters';
import { NextRequest, NextResponse } from 'next/server';
import { issueUpdateSchema } from '../../../../../../../../.temp/schemas/issue';
import { prisma } from '@/lib/prisma';
import { authenticated } from '@/lib/guards';

type Context = { params: Promise<{ boardId: string; issueId: string }> };
export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const auth = await authenticated(request, await params);
    const userId = auth.user.id;

    const { boardId, issueId } = await params;
    const body = await request.json();

    const boardIssue = await prisma.boardIssue.findUnique({ where: { boardId, issueId } });
    if (!boardIssue) throw new Error('Board issue not found');

    const input = issueUpdateSchema.parse(body);
    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: { ...input, updatedAt: new Date() },
    });
    const result = updatedIssue;

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
}
