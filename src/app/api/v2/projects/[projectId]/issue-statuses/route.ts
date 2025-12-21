import { NextRequest, NextResponse } from 'next/server';
import { httpExceptionFilter } from '@/lib/http/filters';
import { prisma } from '@/lib/prisma';
import { genIssueStatusId } from '@/features/projects/configs/id-generators';

type Context = { params: Promise<{ projectId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const { projectId } = await params;
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
    const { projectId } = await params;
    const input = await request.json();
    const id = input?.id ?? genIssueStatusId();

    const { name, description, iconURL, color, category, sequence } = input;

    const newStatus = await prisma.issueStatus.create({
      data: {
        id,
        projectId,
        name,
        description,
        iconURL,
        color,
        category,
        sequence: sequence ?? 0,
      },
    });
    return NextResponse.json(newStatus, { status: 201 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const { projectId } = await params;
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
