import { registerIssueTools } from './issue-tools';
import { registerProjectTools } from './project-tools';
import { registerSearchTools } from './search-tools';

export const initTools = () => {
  registerIssueTools();
  registerProjectTools();
  registerSearchTools();
};
