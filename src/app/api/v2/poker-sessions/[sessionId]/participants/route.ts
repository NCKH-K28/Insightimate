import { planingPokeService } from '@/features/planingpoke/server';
import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/auth';
import { authenticated } from '@/lib/auth/guards';
import { NextResponse } from 'next/server';

type Params = { sessionId: string };

export const GET = middlewareHandler<Params>([authenticated], async (req, { params }) => {
  const auth = await getAuthFromRequest(req);
  const result = await planingPokeService.listParticipants(params.sessionId, {
    actorId: auth.user.id,
  });
  return NextResponse.json(result, { status: 200 });
});

export const POST = middlewareHandler<Params>([authenticated], async (req, { params }) => {
  const auth = await getAuthFromRequest(req);
  const participant = await planingPokeService.joinSession(params.sessionId, {
    actorId: auth.user.id,
  });
  return NextResponse.json(participant, { status: 201 });
});
