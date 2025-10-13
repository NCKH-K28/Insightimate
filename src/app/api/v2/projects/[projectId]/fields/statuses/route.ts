import { projectsService } from '@/features/projects/server/projects.service';
import { authenticated, getAuthFromRequest } from '@/lib/auth';
import { middlewareHandler } from '@/lib/http/api-handler';
import { NextResponse } from 'next/server';

type Params = { projectId: string };
export const GET = middlewareHandler<Params>([authenticated], async (req) => {
  const auth = getAuthFromRequest(req);
  const params = req.params;

  const result = await projectsService.listStatuses(params.projectId);
  return NextResponse.json(result, { status: 200 });
});
