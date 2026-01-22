import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/authn';
import { authenticated } from '@/lib/authn/guards';
import { NextResponse } from 'next/server';
import { memberService } from '@/features/workspaces/server';

type Params = { workspaceId: string };
export const GET = middlewareHandler<Params>([authenticated], async (req, { params }) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const result = await memberService.listMembers(
    { filter: params, include: { permissions: true } },
    { actorId },
  );
  return NextResponse.json(result, { status: 200 });
});
