import { httpExceptionFilter } from '@/lib/http/filters';
import { authenticated } from '@/lib/guards';
import { getBoard } from '@/lib/services/old/board';
import { NextRequest, NextResponse } from 'next/server';

type Context = { params: Promise<{ boardId: string }> };
export async function GET(request: NextRequest, ctx: Context) {
  try {
    const { user } = await authenticated(request, await ctx.params);
    const userId = user.id;

    const { boardId } = await ctx.params;
    const result = await getBoard({ boardId, userId });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
}
