import { httpExceptionFilter } from '@/lib/http/filters';
import { NextRequest, NextResponse } from 'next/server';
import { boardSprintUpdateSchema } from '../../../../../../../../.temp/schemas/board-sprint';
import { deleteBoardSprint, updateBoardSprint } from '@/lib/services/old/board';
import { authenticated } from '@/lib/guards';

type Context = { params: Promise<{ boardId: string; sprintId: string }> };
export const PATCH = async (request: NextRequest, ctx: Context) => {
  try {
    const auth = await authenticated(request, await ctx.params);
    const userId = auth.user.id;

    const { boardId, sprintId } = await ctx.params;

    const body = await request.json();
    const input = boardSprintUpdateSchema.parse(body);
    const result = await updateBoardSprint({ boardId, sprintId }, input);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
};

export const DELETE = async (request: NextRequest, ctx: Context) => {
  try {
    const auth = await authenticated(request, await ctx.params);
    const userId = auth.user.id;

    const { boardId, sprintId } = await ctx.params;
    const result = await deleteBoardSprint({ boardId, sprintId });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
};
