import { toolRegistry } from '../registry';
import { AgentTool } from '../types';
import {
  getIssue,
  listIssues,
  patchIssues,
  issueMetrics,
  ZGetIssueInput,
  ZListIssuesInput,
  ZPatchIssueInput,
  ZIssueMetricsInput,
} from '../../../ai/insightmate/services/issues';

export const registerIssueTools = () => {
  const getIssueTool: AgentTool = {
    name: 'get_issue',
    description: 'Get issue by id',
    schema: ZGetIssueInput,
    execute: async (input, ctx) => getIssue(input, { actorId: ctx.userId }),
  };

  const listIssuesTool: AgentTool = {
    name: 'list_issues',
    description: 'List issues',
    schema: ZListIssuesInput,
    execute: async (input, ctx) => listIssues(input, { actorId: ctx.userId }),
  };

  const issueMetricsTool: AgentTool = {
    name: 'issue_metrics',
    description: 'Get issue metrics',
    schema: ZIssueMetricsInput,
    execute: async (input, ctx) => issueMetrics(input, { actorId: ctx.userId }),
  };

  // Note: Patch tool requires approval in the original, we will handle that in the Orchestrator policy later.
  const patchIssuesTool: AgentTool = {
    name: 'patch_issues',
    description: 'Batch patch issues (create, update, delete)',
    schema: ZPatchIssueInput,
    execute: async (input, ctx) => patchIssues(input, { actorId: ctx.userId }),
  };

  toolRegistry.register(getIssueTool);
  toolRegistry.register(listIssuesTool);
  toolRegistry.register(issueMetricsTool);
  toolRegistry.register(patchIssuesTool);
};
