import { toolRegistry } from '../registry';
import { AgentTool } from '../types';
import { search } from '@/features/query/server/cqrs/q-search-v2';
import { ZQueryParams } from '@/contracts/query/schema-v2';

export const registerSearchTools = () => {
  const searchTool: AgentTool = {
    name: 'search',
    description: 'Full-text search for issues, projects, sprints, users',
    schema: ZQueryParams,
    execute: async (input, ctx) => search(input, { actorId: ctx.userId }),
  };

  toolRegistry.register(searchTool);
};
