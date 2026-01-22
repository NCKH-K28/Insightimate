import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/authn';
import { authenticated } from '@/lib/authn/guards';
import { projectsService } from '@/features/projects/server/projects.service';
import { NextResponse } from 'next/server';
import { ZProjectUpdateInput } from '@/contracts/projects';

export const GET = middlewareHandler<{ projectId: string }>(
  [authenticated],
  async (req, { params }) => {
    const auth = await getAuthFromRequest(req);
    const context = { actorId: auth.user.id };
    const { projectId } = params;

    const result = await projectsService.getById(projectId, context);
    return NextResponse.json(result, { status: 200 });
  },
);

export const DELETE = middlewareHandler<{ projectId: string }>(
  [authenticated],
  async (req, { params }) => {
    const auth = await getAuthFromRequest(req);
    const context = { actorId: auth.user.id };
    const { projectId } = params;

    const result = await projectsService.deleteProject(projectId, context);
    return NextResponse.json(result, { status: 200 });
  },
);

// patch
export const PATCH = middlewareHandler<{ projectId: string }>(
  [authenticated],
  async (req, { params }) => {
    const auth = await getAuthFromRequest(req);
    const context = { actorId: auth.user.id };
    const { projectId } = params;
    const body = await req.json();
    const input = await ZProjectUpdateInput.parse(body);
    const result = await projectsService.update(projectId, input, context);
    return NextResponse.json(result, { status: 200 });
  },
);
