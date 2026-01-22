import { ZTeamCreateInput } from '@/contracts/teams';
import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/authn';
import { authenticated } from '@/lib/authn/guards';
import { NextResponse } from 'next/server';
import { teamsService } from '@/features/teams/server/teams.service';

export const GET = middlewareHandler([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const result = await teamsService.listTeams({}, { actorId: auth.user.id });
  return NextResponse.json(result, { status: 200 });
});

export const POST = middlewareHandler([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const body = await req.json();
  const input = ZTeamCreateInput.parse(body);
  const result = await teamsService.createTeam(input, { actorId: auth.user.id });
  return NextResponse.json(result, { status: 201 });
});
