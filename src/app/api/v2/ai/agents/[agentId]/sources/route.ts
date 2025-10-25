import {
  sourceService,
  ZSourceCreateInput,
  ZSourceListInput,
} from '@/features/agents/server/services/source.service';
import { authenticatedV2, getAuthFromRequest } from '@/lib/auth';
import { compose } from '@/lib/http/api-compose';
import { NextResponse } from 'next/server';
import merge from 'lodash/merge';

import z from 'zod';

const ZSourceParams = z.object({ agentId: z.string() });

export const GET = compose(authenticatedV2, async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const params = ZSourceParams.parse(req.params);
  const input = ZSourceListInput.parse(merge({ filter: { agentId: params.agentId } }, req.query));

  const result = await sourceService.list(input, { actorId });

  return NextResponse.json(result);
});

export const POST = compose(authenticatedV2, async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const body = await req.json();
  const params = ZSourceParams.parse(req.params);
  const input = ZSourceCreateInput.parse({ ...body, ...params });
  const result = await sourceService.create(input, { actorId });

  return NextResponse.json(result);
});
