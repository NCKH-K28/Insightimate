import { ZBoardSprintCreateInput } from '@/contracts/boards/board.input';
import { middlewareHandler } from '@/lib/http/api-handler';
import { boardsService } from '@/features/boards/server/service';
import { NextResponse } from 'next/server';

export const POST = middlewareHandler<{
  boardId: string;
}>([], async (req) => {
  const prams = req.params;
  const body = await req.json();
  const input = ZBoardSprintCreateInput.parse(body);
  const result = await boardsService.createSprint({ boardId: prams.boardId }, input);
  return NextResponse.json(result, { status: 201 });
});
