import { ZBoardSprintCompleteInput } from '@/contracts/boards/board.input';
import { boardsService } from '@/features/boards/server/service';
import { authenticated } from '@/lib/auth/authn';
import { middlewareHandler } from '@/lib/http/api-handler';
import { NextResponse } from 'next/server';

type Params = { boardId: string; sprintId: string };
export const POST = middlewareHandler<Params>([authenticated], async (req) => {
  const params = req.params;
  const body = await req.json();

  const input = ZBoardSprintCompleteInput.parse(body);
  const result = await boardsService.completeSprint(params, input);

  return NextResponse.json(result, { status: 200 });
});
