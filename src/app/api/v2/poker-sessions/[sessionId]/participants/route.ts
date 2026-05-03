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
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  if (action === 'invite') {
    const body = await req.json().catch(() => ({}));
    if (!body?.userId || typeof body.userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    const role =
      body.role === 'OBSERVER' || body.role === 'HOST' || body.role === 'VOTER'
        ? body.role
        : 'VOTER';
    const result = await planingPokeService.inviteParticipant(
      params.sessionId,
      { userId: body.userId, role },
      { actorId: auth.user.id },
    );
    return NextResponse.json(result, { status: 201 });
  }

  const participant = await planingPokeService.joinSession(params.sessionId, {
    actorId: auth.user.id,
  });
  return NextResponse.json(participant, { status: 201 });
});
