import { teamsService } from '@/features/teams/server/teams.service';
import { authenticated, getAuthFromRequest } from '@/lib/auth';
import { middlewareHandler } from '@/lib/http/api-handler';
import { NextResponse } from 'next/server';

type Params = { teamId: string; memberId: string };

export const GET = middlewareHandler<Params>([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const result = await teamsService.getMember(req.params, { actorId: auth.user.id });
  return NextResponse.json(result, { status: 200 });
});

export const DELETE = middlewareHandler<Params>([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const result = await teamsService.removeMember(req.params, { actorId: auth.user.id });
  return NextResponse.json(result, { status: 200 });
});
