import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Issue } from '@/core/issue';
import { httpExceptionFilter } from '@/lib/http/filters';
import { _issues } from '@/mocks/issues';

type Context = { params: Promise<{ projectId: string }> };
export async function GET(request: NextRequest, context: Context) {
  try {
    const { projectId } = await context.params;

    const issues: Issue[] = _issues.map((issue, index) => ({
      ...issue,
      rank: index + 1,
      projectId,
    }));

    return NextResponse.json(issues);
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
}
