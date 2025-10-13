import { NextRequest, NextResponse } from 'next/server';
import { httpExceptionFilter } from '@/lib/http/filters';
import { prisma } from '@/lib/prisma';

type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, { params }: Context) {
  try {
    const { id: projectId } = await params;
    const priorities = await prisma.issuePriority.findMany({ where: { projectId } });
    const result = { items: priorities, total: priorities.length };
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
}
