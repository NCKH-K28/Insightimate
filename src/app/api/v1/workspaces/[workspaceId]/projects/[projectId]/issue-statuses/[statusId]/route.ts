import { NextRequest, NextResponse } from 'next/server';
import { httpExceptionFilter } from '@/lib/http/filters';
import { prisma } from '@/lib/prisma';

type Context = { params: Promise<{ id: string; statusId: string }> };
export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const { id: projectId, statusId } = await params;
    if (!statusId) return NextResponse.json({ error: 'Status ID is required' }, { status: 400 });
    await prisma.issueStatus.delete({ where: { id: statusId, projectId } });
    return NextResponse.json({ message: 'Issue status deleted successfully' }, { status: 200 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
}
