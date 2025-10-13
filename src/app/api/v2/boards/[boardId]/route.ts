import { middlewareHandler } from '@/lib/http/api-handler';
import { boardsService } from '@/features/boards/server/service';
import { NextResponse } from 'next/server';

// FIXME: missing auth
export const GET = middlewareHandler<{ boardId: string }>([], async (req, { params }) => {
  const { boardId } = params;
  const result = await boardsService.getById(boardId);
  return NextResponse.json(result);
});
