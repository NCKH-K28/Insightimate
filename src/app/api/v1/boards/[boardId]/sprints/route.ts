import { NextRequest, NextResponse } from 'next/server';
import { httpExceptionFilter } from '@/lib/http/filters';
import { boardSprintCreateSchema } from '../../../../../../../.temp/schemas/board-sprint';
import { validateBoardState } from '@/lib/validators';
import { createBoardSprint } from '@/lib/services/old/board';
import { Sprint } from '@/core/board';
import { _sprints } from '@/mocks/boards';
import { authenticated } from '@/lib/guards';

type Context = { params: Promise<{ boardId: string }> };

export const GET = async (request: NextRequest, context: Context) => {
  const sprints: Sprint[] = _sprints;
  const items = sprints;

  return NextResponse.json({ items });
};

export const POST = async (request: NextRequest, ctx: Context) => {
  try {
    const auth = await authenticated(request, await ctx.params);
    const userId = auth.user.id;

    const { boardId } = await ctx.params;
    const body = await request.json();
    const input = boardSprintCreateSchema.superRefine(validateBoardState).parse(body);

    const result = await createBoardSprint({ boardId }, input);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
};
