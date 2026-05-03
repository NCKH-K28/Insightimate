import { planingPokeService } from '@/features/planingpoke/server';
import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/auth';
import { authenticated } from '@/lib/auth/guards';
import { NextResponse } from 'next/server';

type Params = { sessionId: string; participantId: string };

export const PATCH = middlewareHandler<Params>([authenticated], async (req, { params }) => {
  const auth = await getAuthFromRequest(req);
  const body = await req.json().catch(() => ({}));
  if (!['VOTER', 'OBSERVER', 'HOST'].includes(body?.role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }
  const result = await planingPokeService.updateParticipantRole(
    params.sessionId,
    params.participantId,
    { role: body.role },
    { actorId: auth.user.id },
  );
  return NextResponse.json(result, { status: 200 });
});

export const DELETE = middlewareHandler<Params>([authenticated], async (req, { params }) => {
  const auth = await getAuthFromRequest(req);
  const result = await planingPokeService.removeParticipant(
    params.sessionId,
    params.participantId,
    { actorId: auth.user.id },
  );
  return NextResponse.json(result, { status: 200 });
});
