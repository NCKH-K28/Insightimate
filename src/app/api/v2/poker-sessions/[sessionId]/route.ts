import { planingPokeService } from '@/features/planingpoke/server';
import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/auth';
import { authenticated } from '@/lib/auth/guards';
import { NextResponse } from 'next/server';

type Params = { sessionId: string };

export const GET = middlewareHandler<Params>([authenticated], async (req, { params }) => {
  const auth = await getAuthFromRequest(req);
  const session = await planingPokeService.getSession(params.sessionId, {
    actorId: auth.user.id,
  });
  return NextResponse.json(session, { status: 200 });
});
