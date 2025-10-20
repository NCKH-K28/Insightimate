import { ZIssueStatusCreateInput } from '@/contracts/issues/issues.status';
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

export const POST = middlewareHandler<Params>([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const params = req.params;
  const body = await req.json();
  const input = ZIssueStatusCreateInput.parse(body);

  const result = await projectsService.addStatus(params.projectId, input, {
    actorId: auth.user.id,
  });

  return NextResponse.json(result, { status: 201 });
});