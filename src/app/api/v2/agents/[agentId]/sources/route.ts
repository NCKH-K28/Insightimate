import { sourceService } from '@/features/agents/server/services/source.service';
import { authenticatedV2, getAuthFromRequest } from '@/lib/authn';
import { NextResponse } from 'next/server';
import merge from 'lodash/merge';

import z from 'zod';
import { compose } from '@/lib/http/api-compose';
import {
  getZodBody,
  getZodParams,
  getZodQuery,
  zodBodyPipe,
  zodParamsPipe,
  zodQueryPipe,
} from '@/lib/http/zod-pipes';
import { ZDataSourceCreateInput } from '@/contracts/agents/agent.input';
import { ZDataSourceListInput } from '@/contracts/agents/agent.query';

const ZSourceParams = z.object({ agentId: z.string() });
const ZSourceCreateBody = ZDataSourceCreateInput.omit({ agentId: true });

export const GET = compose(
  authenticatedV2,
  zodParamsPipe(ZSourceParams),
  zodQueryPipe(ZDataSourceListInput),
  async (req) => {
    const auth = await getAuthFromRequest(req);
    const actorId = auth.user.id;

    const params = getZodParams(req, ZSourceParams);
    const query = getZodQuery(req, ZDataSourceListInput);

    const input = merge({}, query, { filter: { agentId: params.agentId } });
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
