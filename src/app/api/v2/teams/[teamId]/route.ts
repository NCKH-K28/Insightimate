import { ZTeamUpdateInput } from '@/contracts/teams';
import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/authn';
import { authenticated } from '@/lib/authn/guards';
import { NextResponse } from 'next/server';
import { teamsService } from '@/features/teams/server/teams.service';

type Params = { teamId: string };
export const GET = middlewareHandler<Params>([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const { params } = req;
  const teamId = params.teamId;
  const result = await teamsService.getTeamById(
    teamId,
    { actorId },
    { include: { members: true } },
  );
  return NextResponse.json(result);
});

export const PATCH = middlewareHandler<Params>([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const { params } = req;
  const body = await req.json();
  const input = ZTeamUpdateInput.parse({ ...body, id: params.teamId });
  const result = await teamsService.updateTeam(input, { actorId: auth.user.id });
  return NextResponse.json(result);
});

export const DELETE = middlewareHandler<Params>([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const { params } = req;
  const teamId = params.teamId;
  const result = await teamsService.deleteTeamById(teamId, { actorId: auth.user.id });
  return NextResponse.json(result);
});
