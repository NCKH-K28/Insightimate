import { NextRequest, NextResponse } from 'next/server';
import { httpExceptionFilter } from '@/lib/http/filters';
import { prisma } from '@/lib/prisma';

type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, { params }: Context) {
  try {
    const { id: projectId } = await params;
    const statuses = await prisma.issueStatus.findMany({
      where: { projectId },
      orderBy: { sequence: 'asc' },
    });
    const result = { items: statuses, total: statuses.length };
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const { id: projectId } = await params;
    const input = await request.json();
    const newStatus = await prisma.issueStatus.create({ data: { ...input, projectId } });
    return NextResponse.json(newStatus, { status: 201 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const { id: projectId } = await params;
    const url = new URL(request.url);
    const statusId = url.searchParams.get('statusId');
    if (!statusId) {
      return NextResponse.json({ error: 'Status ID is required' }, { status: 400 });
    }
    await prisma.issueStatus.delete({ where: { id: statusId, projectId } });
    return NextResponse.json({ message: 'Issue status deleted successfully' }, { status: 200 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
}
