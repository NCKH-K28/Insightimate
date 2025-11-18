import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { genAgentId } from '@/features/agents/utils/id-generator';
import { AIAgentCreateInput, AIAgentUpdateInput } from '@/contracts/agents/agents.input';
import { AIAgentListInput } from '@/contracts/agents/agents.query';
import { Prisma } from '@prisma/client';

export const ZAgentContext = z.object({ actorId: z.string() });
export type AgentContext = z.infer<typeof ZAgentContext>;

const listAgents = async (input: AIAgentListInput, context: AgentContext) => {
  const where: Prisma.AIAgentWhereInput = { ownerId: context.actorId };

  if (input.filter?.workspaceId) where.workspaceId = input.filter.workspaceId;

  const agents = await prisma.aIAgent.findMany({
    where,
    include: { dataSources: true, owner: true },
  });
  return { data: agents, meta: { total: agents.length } };
};

const getAgent = async (context: AgentContext & { agentId: string }) => {
  const agent = await prisma.aIAgent.findFirst({
    where: { id: context.agentId, ownerId: context.actorId },
    include: { dataSources: true },
  });

  return { data: agent };
};

const createAgent = async (input: AIAgentCreateInput, context: AgentContext) => {
  const { actorId } = context;
  const agent = await prisma.aIAgent.create({
    data: { ...input, id: genAgentId(), ownerId: actorId },
    include: { dataSources: true },
  });

  return { data: agent };
};

const updateAgent = async (
  input: AIAgentUpdateInput,
  context: AgentContext & { agentId: string },
) => {
  const agent = await prisma.aIAgent.updateMany({
    where: { id: context.agentId, ownerId: context.actorId },
    data: { ...input },
  });

  return { data: agent };
};

const deleteAgent = async (context: AgentContext & { agentId: string }) => {
  const agent = await prisma.aIAgent.deleteMany({
    where: { id: context.agentId, ownerId: context.actorId },
  });

  return { data: agent };
};

export const aiAgentService = {
  get: getAgent,
  list: listAgents,
  create: createAgent,
  update: updateAgent,
  delete: deleteAgent,
};
