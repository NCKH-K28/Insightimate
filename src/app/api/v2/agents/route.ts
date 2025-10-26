import { authorize } from '@/features/authzV2/utils';
import { authenticated, authenticatedV2, getAuthFromRequest } from '@/lib/auth';
import { compose, Middleware } from '@/lib/http/api-compose';
import { prisma } from '@/lib/prisma';
import { createId } from '@paralleldrive/cuid2';
import { NextResponse } from 'next/server';
import set from 'lodash/set';
import get from 'lodash/get';
import { AIAgentCreateInput, ZAIAgentCreateInput, ZAIAgentListInput } from '@/contracts/agents';
import z from 'zod';
import { aiAgentService } from '@/features/agents/server/services/agent.service';

const zodBodyPipe = <T>(schema: z.ZodType<T>): Middleware => {
  return async (req) => {
    const body = await req.json();
    const parsedBody = schema.safeParse(body);
    if (!parsedBody.success) {
      const msg = parsedBody.error.issues
        .map((i) => `${i.path.join('.')} : ${i.message}`)
        .join('; ');

      return NextResponse.json({ error: 'Invalid request', message: msg }, { status: 400 });
    }
    set(req, 'parsedBody', parsedBody);
  };
};

export const GET = compose(authenticatedV2, async (req) => {
  // const auth = await getAuthFromRequest(req);
  // const actorId = auth.user.id;

  const input = ZAIAgentListInput.parse(req.query);
  const result = await aiAgentService.list(input);

  return NextResponse.json(result);
});

// authorize(authz, 'agent:create', 'workspace', (req) => {
//   const input = get(req, 'parsedBody', null) as AIAgentCreateInput | null;
//   if (!input) throw new Error('Parsed body not found');
//   return { id: input.workspaceId as ResourceRef['id'], type: 'workspace' };
// }),

export const POST = compose(authenticatedV2, async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const body = await req.json();
  const input = ZAIAgentCreateInput.parse({ ...body, leadId: body.leadId || actorId });

  const result = await aiAgentService.create(input, { actorId });

  return NextResponse.json(result);
});
