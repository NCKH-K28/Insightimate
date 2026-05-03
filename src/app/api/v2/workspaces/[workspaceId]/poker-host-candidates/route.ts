import { planingPokeService } from '@/features/planingpoke/server';
import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/auth';
import { authenticated } from '@/lib/auth/guards';
import { NextResponse } from 'next/server';

type Params = { workspaceId: string };

export const GET = middlewareHandler<Params>([authenticated], async (req, { params }) => {
  const auth = await getAuthFromRequest(req);
  const url = new URL(req.url);
  const q = url.searchParams.get('q');
  if (q !== null) {
    const result = await planingPokeService.searchInviteCandidates(
      params.workspaceId,
      q,
      { actorId: auth.user.id },
    );
    return NextResponse.json(result, { status: 200 });
  }
  const result = await planingPokeService.listHostCandidates(params.workspaceId, {
    actorId: auth.user.id,
  });
  return NextResponse.json(result, { status: 200 });
});
