import { z } from 'zod';
import { NextResponse } from 'next/server';
import { authenticatedV2, getAuthFromRequest } from '@/lib/auth';
import { compose } from '@/lib/http/api-compose';
import { ZAIAgentCreateInput } from '@/contracts/agents/agents.input';
import { aiAgentService } from '@/features/agents/server/services/agent.service';
import { getZodBody, getZodParams, zodBodyPipe, zodParamsPipe } from '@/lib/http/zod-pipes';

const ZAgentContext = z.object({ agentId: z.string().min(1, 'agentId is required') });

export const GET = compose(authenticatedV2, zodParamsPipe(ZAgentContext), async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const params = await getZodParams(req, ZAgentContext);
  const result = await aiAgentService.get({ actorId, agentId: params.agentId });

  return NextResponse.json(result, { status: 200 });
});

export const PATCH = compose(
  authenticatedV2,
  zodParamsPipe(ZAgentContext),
  zodBodyPipe(ZAIAgentCreateInput),
  async (req) => {
    const auth = await getAuthFromRequest(req);
    const actorId = auth.user.id;

    const params = await getZodParams(req, ZAgentContext);
    const input = await getZodBody(req, ZAIAgentCreateInput);
    const result = await aiAgentService.update(input, { actorId, agentId: params.agentId });

    return NextResponse.json(result, { status: 200 });
  },
);

export const DELETE = compose(authenticatedV2, zodParamsPipe(ZAgentContext), async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const params = await getZodBody(req, ZAgentContext);
  const result = await aiAgentService.delete({ actorId, agentId: params.agentId });

  return NextResponse.json(result, { status: 200 });
});
