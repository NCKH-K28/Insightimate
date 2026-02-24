import {
  ZBoardIssueItem,
  ZBoardIssueList,
  ZBoardIssueQueryParams,
  ZBoardItem,
} from '@/contracts/boards/board.query';
import {
  ZBoardIssueCreateInput,
  ZBoardIssueMoveInput,
  ZBoardIssueRankUpdate,
  ZBoardIssueUpdateInput,
} from '@/contracts/boards/board.input';
import z from 'zod';
import { ConfigTree, buildApi } from '@/lib/api/_buildapi';
import { ZIssueFacets } from '@/contracts/issues';

// ========== URL FACTORY ==========
const BoardListURL = 'v3/boards' as const;
const BoardItemURL = 'v3/boards/{boardId}' as const;
const IssueListURL = `${BoardItemURL}/issues` as const;
const IssueItemURL = `${IssueListURL}/{issueId}` as const;

const issueApiConfig = {
  create: { path: IssueListURL, method: 'post', schemas: { body: ZBoardIssueCreateInput } },
  get: { path: IssueItemURL, method: 'get', schemas: { response: ZBoardIssueItem } },
  list: {
    path: IssueListURL,
    method: 'get',
    schemas: { query: ZBoardIssueQueryParams, response: ZBoardIssueList },
  },
  update: {
    path: IssueItemURL,
    method: 'patch',
    schemas: { body: ZBoardIssueUpdateInput },
  },
  delete: { path: IssueItemURL, method: 'delete' },
  move: {
    path: `${IssueItemURL}/move` as const,
    method: 'post',
    schemas: { body: ZBoardIssueMoveInput },
  },
  reorder: {
    path: `${IssueListURL}:reorder` as const,
    method: 'post',
    schemas: { body: ZBoardIssueRankUpdate },
  },
  facets: {
    path: `${IssueListURL}:facets` as const,
    method: 'get',
    schemas: { response: ZIssueFacets },
  },
  metrics: { path: `${IssueListURL}:metrics` as const, method: 'get' },
} satisfies ConfigTree;

const sprintApiConfig = {
  get: { path: `${BoardItemURL}/sprints/{sprintId}` as const, method: 'get' },
  create: { path: `${BoardItemURL}/sprints`, method: 'post', schemas: { body: z.any() } },
  update: {
    path: `${BoardItemURL}/sprints/{sprintId}`,
    method: 'patch',
    schemas: { body: z.any() },
  },
  delete: { path: `${BoardItemURL}/sprints/{sprintId}`, method: 'delete' },

  start: {
    path: `${BoardItemURL}/sprints/{sprintId}/start` as const,
    method: 'post',
    schemas: { body: z.any() },
  },
  complete: {
    path: `${BoardItemURL}/sprints/{sprintId}/complete` as const,
    method: 'post',
    schemas: { body: z.any() },
  },
} satisfies ConfigTree;

export const boardApi = buildApi({
  list: { path: BoardListURL, method: 'get' },
  get: { path: BoardItemURL, method: 'get', schemas: { response: ZBoardItem } },
  update: { path: BoardItemURL, method: 'patch', schemas: { response: z.any(), body: z.any() } },
  delete: { path: BoardItemURL, method: 'delete', schemas: { response: z.any() } },

  issues: issueApiConfig,
  sprints: sprintApiConfig,
});
