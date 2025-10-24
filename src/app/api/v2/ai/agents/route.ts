import { authenticated, getAuthFromRequest } from '@/lib/auth';
import { compose } from '@/lib/http/api-compose';
import { prisma } from '@/lib/prisma';
import { createId } from '@paralleldrive/cuid2';
import { NextResponse } from 'next/server';

const genAgentId = () => `ag_${createId()}`;

const createAgent = async (
  body: { name: string; workspaceId: string; description?: string },
  context: { actorId: string },
) => {
  const agent = await prisma.agent.create({
    data: {
      id: genAgentId(),
      name: body.name,
      description: body.description,
      workspaceId: body.workspaceId,
      leadId: context.actorId,
    },
  });

  return { data: agent };
};

const listAgents = async (params: { workspaceId?: string }, context: { actorId: string }) => {
  const agents = await prisma.agent.findMany({
    where: { leadId: context.actorId },
  });

  return { data: agents };
};

const seed = async (body: { workspaceId?: string }, context: { actorId: string }) => {
  await prisma.$transaction(async (tx) => {
    const counts = await tx.agent.count({ where: { leadId: context.actorId } });
    if (counts > 0) return;
    const samples = ['Agent A', 'Agent B', 'Agent C'];
    for (const name of samples) {
      await tx.agent.create({
        data: {
          id: genAgentId(),
          name,
          workspaceId: `ws_${context.actorId}`,
          leadId: context.actorId,
        },
      });
    }
  });
};

export const GET = compose(
  (req) => authenticated(req as any, req.params), //TODO: move to new version
  async (req) => {
    const auth = await getAuthFromRequest(req);
    const actorId = auth.user.id;
    await seed({}, { actorId });

    const query = req.query;

    const result = await listAgents(query, { actorId });

    return NextResponse.json(result);
  },
);

export const POST = compose(
  (req) => authenticated(req as any, req.params), //TODO: move to new version
  async (req) => {
    const auth = await getAuthFromRequest(req);
    const actorId = auth.user.id;

    const body = await req.json();

    const result = await createAgent(body, { actorId });

    return NextResponse.json(result);
  },
);
