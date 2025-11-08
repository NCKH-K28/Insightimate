import { authenticatedV2, getAuthFromRequest } from '@/lib/auth';
import { compose, Middleware } from '@/lib/http/api-compose';
import { NextResponse } from 'next/server';
import { ZAIAgentCreateInput, ZAIAgentListInput } from '@/contracts/agents';
import { aiAgentService } from '@/features/agents/server/services/agent.service';
import { getZodBody, zodBodyPipe } from '@/lib/http/zod-pipes';

// authorize(authz, 'agent:create', 'workspace', (req) => {
//   const input = get(req, 'parsedBody', null) as AIAgentCreateInput | null;
//   if (!input) throw new Error('Parsed body not found');
//   return { id: input.workspaceId as ResourceRef['id'], type: 'workspace' };
// }),

export const GET = compose(authenticatedV2, async (req) => {
  const input = ZAIAgentListInput.parse(req.query);
  const result = await aiAgentService.list(input);

  return NextResponse.json(result);
});

export const POST = compose(authenticatedV2, zodBodyPipe(ZAIAgentCreateInput), async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const input = await getZodBody(req, ZAIAgentCreateInput);
  const result = await aiAgentService.create(input, { actorId });

  return NextResponse.json(result);
});
