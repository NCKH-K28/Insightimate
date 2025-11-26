import { ZSearchInput, ZSearchOutput } from '@/contracts/query/schema-v1';
import { ZListIssuesInput, ZListIssuesOutput } from '@/features/query/server/cqrs/q-issue-list';
import { ZProjectListInput, ZProjectListOutput } from '@/features/query/server/cqrs/q-project-list';
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

export const buildPMSearchTool = (context: { actorId: string }) => {
  const searchProjects = tool({
    name: 'search_projects',
    description: 'Search for projects in your project management system',
    inputSchema: ZProjectListInput,
    outputSchema: ZProjectListOutput,
    execute: (input) => queryService.listProjects(input, context),
  });

  const searchIssues = tool({
    name: 'search_issues',
    description: 'Search for issues in your project management system',
    inputSchema: ZListIssuesInput,
    outputSchema: ZListIssuesOutput,
    execute: (input) => queryService.listIssues(input, context),
  });

  return {
    search_projects: searchProjects,
    search_issues: searchIssues,
  };
};
