import { sourceService, ZSourceCreateInput } from '@/features/agents/server/source.service';
import { authenticatedV2, getAuthFromRequest } from '@/lib/auth';
import { compose } from '@/lib/http/api-compose';
import { NextResponse } from 'next/server';

import z from 'zod';

const ZSourceParams = z.object({ agentId: z.string() });

export const GET = compose(authenticatedV2, async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const params = ZSourceParams.parse(req.params);
  const result = await sourceService.list({ filter: { agentId: params.agentId } }, { actorId });

  return NextResponse.json(result);
});

export const POST = compose(authenticatedV2, async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const params = ZSourceParams.parse(req.params);
  const input = ZSourceCreateInput.parse({ ...req.body, ...params });
  const result = await sourceService.create(input, { actorId });

  return NextResponse.json(result);
});

export const DELETE = compose(authenticatedV2, async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const params = ZSourceParams.parse(req.params);
  const sourceId = params.agentId;
  const result = await sourceService.remove(sourceId, { actorId });

  return NextResponse.json(result);
});
