import { httpExceptionFilter } from '@/lib/http/filters';
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { projectSchema } from '@/core/project';

type Context = { params: Promise<{ projectId: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const { params } = context;
    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: true,
        board: { select: { id: true } },
        types: true,
        priorities: true,
        statuses: true,
      },
    });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const result = projectSchema.parse({
      ...project,
      updatedAt: project.updatedAt.toISOString(),
      createdAt: project.createdAt.toISOString(),

      boardId: project.board?.id,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
}
