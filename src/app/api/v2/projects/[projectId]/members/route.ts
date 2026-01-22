import { ZProjectActorAddInput } from '@/contracts/projects';
import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/authn';
import { authenticated } from '@/lib/authn/guards';
import { projectsService } from '@/features/projects/server/projects.service';
import { NextResponse } from 'next/server';

export const GET = middlewareHandler<{ projectId: string }>(
  [authenticated],
  async (req, { params }) => {
    const auth = await getAuthFromRequest(req);
    const actorId = auth.user.id;

    const { projectId } = params;
    const result = await projectsService.listProjectActors({ projectId }); // FIXME: move to /actors instead /members
    const members = await projectsService.listMembers({ projectId }, { actorId });

    Object.assign(result, { members }); // -- attach members

    return NextResponse.json(result, { status: 200 });
  },
);

export const POST = middlewareHandler<{ projectId: string }>(
  [authenticated],
  async (req, { params }) => {
    const auth = await getAuthFromRequest(req);
    const actorId = auth.user.id;

    const { projectId } = params;
    const body = await req.json();
    const input = ZProjectActorAddInput.parse({ ...body, projectId });
    const result = await projectsService.addProjectActor(input, { actorId });
    return NextResponse.json(result, { status: 201 });
  },
);
