import { ZProjectCreateInput, ZProjectQueryParams } from '@/contracts/projects';
import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/auth/authn';
import { authenticated } from '@/lib/auth/authn/guards';
import { NextResponse } from 'next/server';
import { projectsService } from '@/features/projects/server/projects.service';

export const GET = middlewareHandler([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const queryParams = ZProjectQueryParams.parse(req.query);
  const workspaceId = queryParams.filter?.workspaceId;
  if (!workspaceId) {
    return NextResponse.json({ error: 'Missing workspaceId in query params' }, { status: 400 });
  }

  const result = await projectsService.list(
    { filter: { workspaceId } },
    { actorId },
    { include: { permissions: true } },
  );
  return NextResponse.json(result, { status: 200 });
});

export const POST = middlewareHandler([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const body = await req.json();
  const input = ZProjectCreateInput.parse({ ...body, leadId: auth.user.id });
  const result = await projectsService.create(input, { actorId: auth.user.id });

  return NextResponse.json(result, { status: 201 });
});
