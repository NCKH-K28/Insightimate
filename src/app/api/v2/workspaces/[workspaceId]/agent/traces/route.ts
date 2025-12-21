import { NextResponse } from 'next/server';
import { traceRepository } from '@/features/agents/server/trace-repository';
import { compose } from '@/lib/http/api-compose';
import { authenticatedV2, getAuthFromRequest } from '@/lib/auth';

export const GET = compose<{ workspaceId: string }>(authenticatedV2, async (req) => {
  const auth = await getAuthFromRequest(req);
  const traces = await traceRepository.getTraces(auth.user.id);
  return NextResponse.json(traces);
});
