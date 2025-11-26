import { NextResponse } from 'next/server';
import { authenticatedV2, getAuthFromRequest } from '@/lib/auth';
import { compose } from '@/lib/http/api-compose';
import { ZAIAgentCreateInput } from '@/contracts/agents/agents.input';
import { aiAgentService } from '@/features/agents/server/services/agent.service';
import { getZodBody, zodBodyPipe } from '@/lib/http/zod-pipes';
import { ZAgentListInput } from '@/contracts/agents/agents.query';

export const GET = compose(authenticatedV2, zodBodyPipe(ZAgentListInput), async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const input = await getZodBody(req, ZAgentListInput);
  const result = await aiAgentService.list(input, { actorId });

  return NextResponse.json(result, { status: 200 });
});

export const POST = compose(authenticatedV2, zodBodyPipe(ZAIAgentCreateInput), async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const input = await getZodBody(req, ZAIAgentCreateInput);
  const result = await aiAgentService.create(input, { actorId });

  return NextResponse.json(result, { status: 201 });
});
