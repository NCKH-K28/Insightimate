import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AgentOrchestrator } from '@/features/agents/server/orchestrator';
import { randomUUID } from 'crypto';
import { middlewareHandler } from '@/lib/http/api-handler';
import { authenticated, getAuthFromRequest } from '@/lib/auth/authn';

const schema = z.object({ input: z.string() });

export const POST = middlewareHandler<{ workspaceId: string }>(
  [authenticated],
  async (req, { params }) => {
    try {
      const session = await getAuthFromRequest(req);
      const { workspaceId } = params;
      const body = await req.json();
      const { input } = schema.parse(body);

      const orchestrator = new AgentOrchestrator();

      // Create a runId for this execution
      const runId = randomUUID();

      const result = await orchestrator.run(input, {
        userId: session.user.id,
        workspaceId,
        runId,
      });

      return NextResponse.json({ runId, result });
    } catch (error) {
      console.error('Agent run failed:', error);
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
  },
);
