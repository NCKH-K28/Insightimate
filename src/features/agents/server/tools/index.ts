import { registerIssueTools } from './issue-tools';
import { registerProjectTools } from './project-tools';
import { registerSearchTools } from './search-tools';

export * from './pm-search-tool';
export * from './web-search';

export const initTools = () => {
  registerIssueTools();
  registerProjectTools();
  registerSearchTools();
};
