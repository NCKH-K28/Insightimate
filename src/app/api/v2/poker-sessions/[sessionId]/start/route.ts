import { ZPokerSessionStartInput } from '@/features/planingpoke/types/inputs';
import { planingPokeService } from '@/features/planingpoke/server';
import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/auth';
import { authenticated } from '@/lib/auth/guards';
import { NextResponse } from 'next/server';

type Params = { sessionId: string };

export const POST = middlewareHandler<Params>([authenticated], async (req, { params }) => {
  const auth = await getAuthFromRequest(req);
  const body = await req.json();
  const input = ZPokerSessionStartInput.parse(body);
  const session = await planingPokeService.startSession(params.sessionId, input, {
    actorId: auth.user.id,
  });
  return NextResponse.json(session, { status: 200 });
});
