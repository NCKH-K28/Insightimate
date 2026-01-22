import { authenticated, getAuthFromRequest } from '@/lib/authn';
import { boardsService } from '@/features/boards/server/service';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';
import { middlewareHandler } from '@/lib/http/api-handler';

export const GET = middlewareHandler<{ boardId: string }>([authenticated], async (req) => {
  const { boardId } = req.params;
  const auth = await getAuthFromRequest(req);
  const context = { actorId: auth.user.id };

  const result = await boardsService.issueFacets(boardId, context);
  return NextResponse.json(result, { status: 200 });
});
