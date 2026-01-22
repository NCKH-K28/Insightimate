import { ZWorkspaceCreateInput } from '@/contracts/workspaces';
import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/authn';
import { authenticated } from '@/lib/authn/guards';
import { NextResponse } from 'next/server';
import { workspaceService } from '@/features/workspaces/server/service';

export const GET = middlewareHandler([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const result = await workspaceService.list(actorId);
  return NextResponse.json(result, { status: 200 });
});

export const POST = middlewareHandler([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const body = await req.json();
  const input = ZWorkspaceCreateInput.parse(body);
  const result = await workspaceService.create(input, { actorId });

  return NextResponse.json(result, { status: 201 });
});
