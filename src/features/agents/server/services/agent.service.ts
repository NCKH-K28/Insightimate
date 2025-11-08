import { prisma } from '@/lib/prisma';
import { genAgentId } from '@/features/agents/utils/id-generator';
import { AIAgentCreateInput, AIAgentListInput } from '@/contracts/agents';
import z from 'zod';
import { AuthzFacade } from '@/features/authzV2/types';

export const ZAgentContext = z.object({ actorId: z.string().min(1, 'Actor ID is required') });
export type AgentContext = z.infer<typeof ZAgentContext>;
const authz: AuthzFacade = {} as any;

export const createAgent = async (input: AIAgentCreateInput, context: AgentContext) => {
  const { actorId } = context;
  return await prisma.$transaction(async (tx) => {
    const agent = await tx.aIAgent.create({
      data: {
        id: genAgentId(),
        name: input.name,
        description: input.description,
        instructions: input.instructions,
        ownerId: actorId,
        workspaceId: input.workspaceId,
      },
      include: { dataSources: true },
    });

    return { data: agent };
  });
};

export const listAgents = async (input: AIAgentListInput) => {
  const whereClause: any = {};
  if (input.filter?.workspaceId) {
    whereClause.workspaceId = input.filter.workspaceId;
  }

  const agents = await prisma.aIAgent.findMany({
    where: whereClause,
    include: { dataSources: true },
  });

  return { data: agents };
};

export const aiAgentService = {
  create: createAgent,
  list: listAgents,
};
