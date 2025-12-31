import { ZBoardIssueUpdateInput } from '@/contracts/boards/boards.input';
import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/auth/authn';
import { authenticated } from '@/lib/auth/authn/guards';
import { boardsService } from '@/features/boards/server/service';
import { NextResponse } from 'next/server';
import z from 'zod';

const ZBoardIssueParams = z.object({
  boardId: z.string().min(1, 'boardId is required'),
  issueId: z.string().min(1, 'issueId is required'),
});
type BoardIssueParams = z.infer<typeof ZBoardIssueParams>;

export const GET = middlewareHandler<BoardIssueParams>([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const params = req.params;
  const context = { actorId: auth.user.id };

  const validParams = ZBoardIssueParams.parse(params);

  const result = await boardsService.getIssue(validParams, context);
  return NextResponse.json(result);
});

export const PATCH = middlewareHandler<BoardIssueParams>(
  [authenticated],
  async (req, { params }) => {
    const auth = await getAuthFromRequest(req);
    const context = { actorId: auth.user.id };

    const validParams = ZBoardIssueParams.parse(params);

    const body = await req.json();
    const input = await ZBoardIssueUpdateInput.parse(body);
    const result = await boardsService.updateIssue(validParams, input, context);
    return NextResponse.json(result);
  },
);

export const DELETE = middlewareHandler<BoardIssueParams>(
  [authenticated],
  async (req, { params }) => {
    const auth = await getAuthFromRequest(req);
    const context = { actorId: auth.user.id };

    const validParams = ZBoardIssueParams.parse(params);

    await boardsService.deleteIssue(validParams, context);
    return NextResponse.json({ success: true });
  },
);
