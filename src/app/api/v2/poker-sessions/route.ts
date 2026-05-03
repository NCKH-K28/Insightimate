import { ZPokerSessionCreateApiInput } from '@/features/planingpoke/types/inputs';
import { planingPokeService } from '@/features/planingpoke/server';
import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/auth';
import { authenticated } from '@/lib/auth/guards';
import { NextResponse } from 'next/server';

export const GET = middlewareHandler([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const url = new URL(req.url);
  const workspaceId = url.searchParams.get('workspaceId');
  if (!workspaceId) {
    return NextResponse.json({ message: 'workspaceId is required' }, { status: 400 });
  }
  const result = await planingPokeService.listSessions(
    { workspaceId },
    { actorId: auth.user.id },
  );
  return NextResponse.json(result, { status: 200 });
});

export const POST = middlewareHandler([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const body = await req.json();
  const input = ZPokerSessionCreateApiInput.parse(body);
  const session = await planingPokeService.createSession(input, { actorId: auth.user.id });
  return NextResponse.json(session, { status: 201 });
});
