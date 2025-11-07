import { sourceService } from '@/features/agents/server/services/source.service';
import { authenticatedV2, getAuthFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';
import merge from 'lodash/merge';

import z from 'zod';
import { SourceListInput, ZSourceCreateInput, ZSourceListInput } from '@/contracts/agents';
import { compose } from '@/lib/http/api-compose';
import {
  getZodBody,
  getZodParams,
  getZodQuery,
  zodBodyPipe,
  zodParamsPipe,
  zodQueryPipe,
} from '@/lib/http/zod-pipes';

const ZSourceParams = z.object({ agentId: z.string() });
const ZSourceCreateBody = ZSourceCreateInput.omit({ agentId: true });

export const GET = compose(
  authenticatedV2,
  zodParamsPipe(ZSourceParams),
  zodQueryPipe(ZSourceListInput),
  async (req) => {
    const auth = await getAuthFromRequest(req);
    const actorId = auth.user.id;

    const params = getZodParams(req, ZSourceParams);
    const query = getZodQuery(req, ZSourceListInput);

    const input: SourceListInput = merge({}, query, { filter: { agentId: params.agentId } });
    const result = await sourceService.list(input, { actorId });

    return NextResponse.json(result);
  },
);

export const POST = compose(
  authenticatedV2,
  zodParamsPipe(ZSourceParams),
  zodBodyPipe(ZSourceCreateBody),
  async (req) => {
    const auth = await getAuthFromRequest(req);
    const actorId = auth.user.id;

    const params = getZodParams(req, ZSourceParams);
    const body = getZodBody(req, ZSourceCreateBody);

    const input = { agentId: params.agentId, ...body };
    const result = await sourceService.create(input, { actorId });

    return NextResponse.json(result);
  },
);
