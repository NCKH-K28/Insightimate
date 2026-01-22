import { ZBoardIssueCreateInput } from '@/contracts/boards/board.input';
import { ZBoardIssueQueryParams } from '@/contracts/boards/board.query';
import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/authn';
import { authenticated } from '@/lib/authn/guards';
import { boardsService } from '@/features/boards/server/service';
import { NextResponse } from 'next/server';

export const GET = middlewareHandler<{ boardId: string }>(
  [authenticated],
  async (req, { params }) => {
    const auth = await getAuthFromRequest(req);
    const context = { actorId: auth.user.id };

    const { query } = req;
    const { boardId } = params;

    const validQuery = ZBoardIssueQueryParams.parse(query);
    const result = await boardsService.listIssues(
      { id: boardId, type: validQuery.filter?.type },
      validQuery,
      context,
    );
    return NextResponse.json(result, { status: 200 });
  },
);

export const POST = middlewareHandler<{ boardId: string }>(
  [authenticated],
  async (req, { params }) => {
    const auth = await getAuthFromRequest(req);
    const context = { actorId: auth.user.id };

    const { boardId } = params;
    const body = await req.json();
    const input = await ZBoardIssueCreateInput.parse(body);
    const result = await boardsService.addIssue(boardId, input, context);
    return NextResponse.json(result, { status: 201 });
  },
);
