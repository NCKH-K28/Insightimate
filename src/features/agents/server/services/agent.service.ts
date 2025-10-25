import { openfgaClient } from '@/lib/authz/openfga';
import { prisma } from '@/lib/prisma';
import { createId } from '@paralleldrive/cuid2';
import z from 'zod';

export const ZAgentSourceCreate = z.object({
  sourceType: z.enum(['PROJECT']),
  sourceId: z.string(),
  agentId: z.string(),
});

export const ZAgentSourceUpdate = z.object({
  sourceType: z.enum(['PROJECT']).optional(),
  sourceId: z.string().optional(),
  agentId: z.string().optional(),
});

export const ZAgentCreate = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  workspaceId: z.string(),

  sources: z.array(ZAgentSourceCreate).optional(),
});

export const ZAgentUpdate = ZAgentCreate.pick({ name: true, description: true })
  .partial()
  .extend({ id: z.string() });

export type AgentCreateInput = z.infer<typeof ZAgentCreate>;
export type AgentUpdateInput = z.infer<typeof ZAgentUpdate>;

// ========================== Service Methods ==========================

const genAgentId = () => `ai_${createId()}`;

type AgentContext = { actorId: string };
export const createAgent = async (input: AgentCreateInput, context: AgentContext) => {
  // FIXME: check cerbos permission
  const check = await openfgaClient.check({
    user: context.actorId,
    relation: 'can_view',
    object: `workspace:${input.workspaceId}`,
  });
  if (!check.allowed) throw new Error('Permission denied');

  return await prisma.$transaction(async (tx) => {
    const agent = await tx.agent.create({
      data: {
        id: genAgentId(),
        name: input.name,
        description: input.description,
        workspaceId: input.workspaceId,
        leadId: context.actorId,
      },
      include: { sources: true },
    });

    // add cho openfga

    return { data: agent };
  });
};

export const getAgentById = async (agentId: string, context: AgentContext) => {
  // FIXME: check cerbos permission
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: { sources: true },
  });
  if (!agent) throw new Error('Agent not found');
  const check = await openfgaClient.check({
    user: context.actorId,
    relation: 'can_view',
    object: `workspace:${agent.workspaceId}`,
  });
  if (!check.allowed) throw new Error('Permission denied');
  return agent;
};

export const deleteAgentById = async (agentId: string, context: AgentContext) => {
  await getAgentById(agentId, context);
  return await prisma.agent.delete({ where: { id: agentId } });
};

// ==
type AgentFilter = { workspaceId: string };

type ListAgentsQuery = { filter?: AgentFilter };
export const listAgents = async (query: ListAgentsQuery, context: AgentContext) => {
  const { filter } = query;
  const agents = await prisma.agent.findMany({
    where: { workspaceId: filter?.workspaceId, leadId: context.actorId },
  });

  return { data: agents };
};
