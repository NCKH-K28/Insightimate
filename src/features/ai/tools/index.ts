import { tool } from 'ai';
import {
  getIssue,
  issueMetrics,
  listIssues,
  patchIssues,
  ZGetIssueInput,
  ZGetIssueOutput,
  ZIssueMetricsInput,
  ZIssueMetricsOutput,
  ZListIssuesInput,
  ZListIssuesOutput,
  ZPatchIssueInput,
} from '../insightmate/services/issues';
import {
  getProject,
  listProjects,
  ZGetProjectInput,
  ZGetProjectOutput,
  ZListProjectsInput,
  ZListProjectsOutput,
} from '../insightmate/services/project';
import {
  getSprint,
  listSprints,
  ZGetSprintInput,
  ZGetSprintOutput,
  ZListSprintsInput,
  ZListSprintsOutput,
} from '../insightmate/services/sprint';
import { search } from '@/features/query/server/cqrs/q-search-v2';
import { ZQueryOutput, ZQueryParams } from '@/contracts/query/schema-v2';

const logAndThrow = (e: Error) => {
  console.error(e);
  throw e;
};

export const getIssueTool = (ctx: { actorId: string }) => {
  return tool({
    description: 'Get issue by id',
    inputSchema: ZGetIssueInput,
    outputSchema: ZGetIssueOutput,
    execute: ({ id }) => getIssue({ id }, ctx).catch(logAndThrow),
  });
};

export const listIssuesTool = (ctx: { actorId: string }) => {
  return tool({
    description: 'List issues',
    inputSchema: ZListIssuesInput,
    outputSchema: ZListIssuesOutput,
    execute: (input) => listIssues(input, ctx).catch(logAndThrow),
  });
};

export const patchIssuesTool = (ctx: { actorId: string }) => {
  return tool({
    description: 'Batch patch issues: create/update/delete (requires approval).',
    inputSchema: ZPatchIssueInput,
    needsApproval: true,
    execute: (input) => patchIssues(input, ctx).catch(logAndThrow),
  });
};

export const issueMetricsTool = (ctx: { actorId: string }) => {
  return tool({
    description: 'Get issue metrics',
    inputSchema: ZIssueMetricsInput,
    outputSchema: ZIssueMetricsOutput,
    execute: (input) => issueMetrics(input, ctx).catch(logAndThrow),
  });
};

export const getProjectTool = (ctx: { actorId: string }) => {
  return tool({
    description: `Get project by id (include all worktypes as statuses, types, priorities, ...)`,
    inputSchema: ZGetProjectInput,
    outputSchema: ZGetProjectOutput,
    execute: ({ id }) => getProject({ id }, ctx).catch(logAndThrow),
  });
};

export const listProjectsTool = (ctx: { actorId: string }) => {
  return tool({
    description: 'List projects',
    inputSchema: ZListProjectsInput,
    outputSchema: ZListProjectsOutput,
    execute: (input) => listProjects(input, ctx).catch(logAndThrow),
  });
};

export const getSprintTool = (ctx: { actorId: string }) => {
  return tool({
    description: 'Get sprint by id',
    inputSchema: ZGetSprintInput,
    outputSchema: ZGetSprintOutput,
    execute: ({ id }) => getSprint({ id }, ctx).catch(logAndThrow),
  });
};

export const listSprintsTool = (ctx: { actorId: string }) => {
  return tool({
    description: 'List sprints',
    inputSchema: ZListSprintsInput,
    outputSchema: ZListSprintsOutput,
    execute: (input) => listSprints(input, ctx).catch(logAndThrow),
  });
};

export const searchTool = (ctx: { actorId: string }) => {
  return tool({
    description: 'Full-text search for issues, projects, sprints, users, ...',
    inputSchema: ZQueryParams,
    outputSchema: ZQueryOutput,
    execute: (input) => search(input, ctx).catch(logAndThrow),
  });
};
