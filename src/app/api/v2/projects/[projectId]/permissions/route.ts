import { middlewareHandler } from '@/lib/http/api-handler';
import { authenticated } from '@/lib/auth/guards';
import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import { projectRolesService } from '@/features/projects/server/project-roles.service';

export const GET = middlewareHandler<{ projectId: string }>(
  [authenticated],
  async (req, { params }) => {
    const auth = await getAuthFromRequest(req);
    const { projectId } = params;
    const actorId = auth.user.id;
    const result = await projectRolesService.listProjectRoles(projectId, { actorId });
    return NextResponse.json(result, { status: 200 });
  },
);

export const POST = middlewareHandler<{ projectId: string }>(
  [authenticated],
  async (req, { params }) => {
    const auth = await getAuthFromRequest(req);
    const userId = auth.user.id;
    const { projectId } = params;
    const result = await projectRolesService.listProjectRoles(projectId, { actorId: userId });
    return NextResponse.json(result, { status: 200 });
  },
);

// export const PUT = middlewareHandler<{ projectId: string }>(
//   [authenticated],
//   async (req, { params }) => {
//     throw new Error('Method not allowed');
//   },
// );
