import { ZSearchInput, ZSearchOutput } from '@/contracts/query/schema-v1';
import { queryService } from '@/features/query/server/service';
import { tool } from 'ai';

export const pmSearchTool = tool({
  name: 'pmSearch',
  description:
    'Search your project management knowledge base for relevant information about issues, projects, sprints',
  inputSchema: ZSearchInput,
  outputSchema: ZSearchOutput,
  execute: (input) => queryService.search(input),
});
