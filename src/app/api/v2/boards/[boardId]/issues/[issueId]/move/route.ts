import { ZBoardIssueMoveInput } from '@/contracts/boards/board.input';
import { middlewareHandler } from '@/lib/http/api-handler';
import { boardsService } from '@/features/boards/server/service';
import { NextResponse } from 'next/server';

export const POST = middlewareHandler<{ boardId: string; issueId: string }>([], async (req) => {
  const body = await req.json();
  const params = req.params;
  const input = ZBoardIssueMoveInput.parse(body);
  const result = await boardsService.moveIssue(params, input);
  return NextResponse.json(result);
});
