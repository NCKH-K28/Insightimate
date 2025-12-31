import { ZProjectRoleWriteInput } from '@/contracts/projects';
import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/auth/authn';
import { authenticated } from '@/lib/auth/authn/guards';
import { projectRolesService } from '@/features/projects/server/project-roles.service';
import { NextResponse } from 'next/server';

export const POST = middlewareHandler<{ projectId: string }>([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;
  const { params } = req;
  const body = await req.json();
  const input = ZProjectRoleWriteInput.parse({ ...body, ...params });
  const result = await projectRolesService.projectRolesWrite(input, { actorId });
  return NextResponse.json(result, { status: 200 });
});
