import { boardsService } from '@/features/boards/server/service';
import { authenticated } from '@/lib/authn';
import { middlewareHandler } from '@/lib/http/api-handler';
import { NextResponse } from 'next/server';

type Params = { boardId: string; sprintId: string };
export const POST = middlewareHandler<Params>([authenticated], async (req) => {
  const params = req.params;

  const result = await boardsService.startSprint(params);
  return NextResponse.json(result, { status: 200 });
});
