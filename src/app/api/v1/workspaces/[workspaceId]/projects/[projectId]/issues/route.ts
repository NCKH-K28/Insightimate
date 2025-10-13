import { NextResponse, NextRequest } from 'next/server';
import qs from 'qs';

import { httpExceptionFilter } from '@/lib/http/filters';
import { issueQueryParamsSchema } from '../../../../../../../../../.temp/schemas/issue';
import { createProjectIssue, listProjectIssues } from '@/lib/services/old/project-issue';
import { projectIssueCreateSchema } from '@/lib/schemas/project-issue';
import { authenticated } from '@/lib/guards';

type Context = { params: Promise<{ projectId: string }> };
export async function GET(request: NextRequest, context: Context) {
  try {
    const { params } = context;
    const { projectId } = await params;

    const searchParams = request.nextUrl.searchParams;
    const queryParams = qs.parse(searchParams.toString());
    const validParams = issueQueryParamsSchema.parse(queryParams);

    const result = await listProjectIssues({ projectId }, validParams);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
}

export async function POST(request: NextRequest, ctx: Context) {
  try {
    const auth = await authenticated(request, await ctx.params);
    const userId = auth.user.id;

    const { projectId } = await ctx.params;
    const body = await request.json();
    const validBody = projectIssueCreateSchema.parse(body);
    const result = await createProjectIssue({ projectId, userId }, validBody);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
}
