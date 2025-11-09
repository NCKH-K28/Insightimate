import { httpExceptionFilter } from '@/lib/http/filters';
import {
  boardIssueCreateSchema,
  boardIssueQueryParamsSchema,
} from '../../../../../../../.temp/schemas/board-issue';
import { NextRequest, NextResponse } from 'next/server';
import { getBoardIssues, createBoardIssue } from '@/lib/services/old/board';
import qs from 'qs';
import { authenticated } from '@/lib/guards';

const parseQueryParams = (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams.toString();
  const parsed = qs.parse(searchParams);
  return parsed;
};

type Context = { params: Promise<{ boardId: string }> };
export async function GET(request: NextRequest, ctx: Context) {
  try {
    const { user } = await authenticated(request, await ctx.params);
    const userId = user.id;

    const { boardId } = await ctx.params;
    const reqParams = parseQueryParams(request);
    const params = boardIssueQueryParamsSchema.parse(reqParams);

    const result = await getBoardIssues({ boardId }, params);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
}

export async function POST(request: NextRequest, ctx: Context) {
  try {
    const { user } = await authenticated(request, await ctx.params);
    const userId = user.id;

    const { boardId } = await ctx.params;
    const body = await request.json();

    const input = boardIssueCreateSchema.parse(body);
    const { sprintId, ...rest } = input;
    const result = await createBoardIssue({ boardId, userId, sprintId }, rest);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
}
