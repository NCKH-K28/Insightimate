import { planingPokeService } from '@/features/planingpoke/server';
import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/auth';
import { authenticated } from '@/lib/auth/guards';
import { NextResponse } from 'next/server';

type Params = { sessionId: string };

export const POST = middlewareHandler<Params>([authenticated], async (req, { params }) => {
  const auth = await getAuthFromRequest(req);
  const session = await planingPokeService.completeSession(params.sessionId, {
    actorId: auth.user.id,
  });
  return NextResponse.json(session, { status: 200 });
});
