import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/authn';
import { authenticated } from '@/lib/authn/guards';
import { projectsService } from '@/features/project/server/projects.service';
import { NextResponse } from 'next/server';

export const DELETE = middlewareHandler<{ projectId: string; memberId: string }>(
  [authenticated],
  async (req, { params }) => {
    const auth = await getAuthFromRequest(req);
    const context = { actorId: auth.user.id };

    const { projectId, memberId: actorId } = params;
    const result = await projectsService.removeActor({ projectId, actorId }, context);
    return NextResponse.json(result, { status: 200 });
  },
);

export const PATCH = middlewareHandler<{ projectId: string; memberId: string }>(
  [authenticated],
  async (req, { params }) => {
    const auth = await getAuthFromRequest(req);
    const context = { actorId: auth.user.id };

    const { projectId, memberId: actorId } = params;
    const body = await req.json();
    const result = await projectsService.updateActor({ projectId, actorId, ...body }, context);
    return NextResponse.json(result, { status: 200 });
  },
);
