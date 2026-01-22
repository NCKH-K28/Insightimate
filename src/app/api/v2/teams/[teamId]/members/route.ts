import { ZTeamMemberAddInput } from '@/contracts/teams';
import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/authn';
import { authenticated } from '@/lib/authn/guards';
import { NextResponse } from 'next/server';
import { teamsService } from '@/features/teams/server/teams.service';

type Params = { teamId: string };
export const POST = middlewareHandler<Params>([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);

  const body = await req.json();
  const { params } = req;
  const input = await ZTeamMemberAddInput.parse(body);
  // log
  const result = await teamsService.addMembers(
    {
      teamId: params.teamId,
      userIds: input.users.map((u) => u.userId),
    },
    { actorId: auth.user.id },
  );
  return NextResponse.json(result, { status: 200 });
});
