import { inviteService, ZInviteUsersInput } from '@/features/authz/server';
import { authenticated, getAuthFromRequest } from '@/lib/auth';
import { middlewareHandler } from '@/lib/http/api-handler';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const resourceType = searchParams.get('resourceType');
  const resourceId = searchParams.get('resourceId');
  if (resourceType !== 'WORKSPACE' || !resourceId) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  const result = await inviteService.listInvites(
    { resourceType: resourceType as 'WORKSPACE', resourceId: resourceId || '' },
    { actorId: 'system' },
  );

  return NextResponse.json(result);
};

export const POST = middlewareHandler([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user?.id;
  const body = await req.json();
  const input = ZInviteUsersInput.parse({
    ...body,
    roleId: body.role,
  });

  const result = await inviteService.inviteUsers(input, { actorId });
  return NextResponse.json(result ?? { success: true });
});
