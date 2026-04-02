import { ConfigTree, buildApi } from '@/lib/api/_buildapi';
import {
  ZSprintResponse,
  ZSprintCreateInput,
  ZSprintUpdateInput,
  ZSprintCompleteInput,
  ZSprintAddIssuesInput,
  ZSprintListQuery,
  ZSprintUserPreferenceInput,
  ZSprintTransferInput,
  ZSprintAnalyticsResponse,
} from '@/contracts/sprints';
import { ZSprintSummary, ZBoardIssueList } from '@/contracts/boards/board.query';
import z from 'zod';

// ========== URL Templates ==========
const SprintListURL = 'v3/sprints' as const;
const SprintItemURL = `${SprintListURL}/{sprintId}` as const;
const SprintIssuesURL = `${SprintItemURL}/issues` as const;
const SprintIssueItemURL = `${SprintIssuesURL}/{issueId}` as const;

// ========== Sprint Detail Response (includes aggregations) ==========
const ZSprintAggregations = z.object({
  issues: z.object({
    _counts: z.object({
      total: z.number(),
      completed: z.number(),
      incompleted: z.number(),
    }),
    _sums: z.object({
      storyPoints: z.object({
        completed: z.number(),
        incompleted: z.number(),
      }),
    }),
  }),
});

export const ZSprintDetailResponse = ZSprintResponse.extend({
  startedAt: z.string().nullable().optional(),
  endedAt: z.string().nullable().optional(),
  _aggregations: ZSprintAggregations.optional(),
});

export type SprintDetailResponse = z.infer<typeof ZSprintDetailResponse>;

// ========== API Config ==========
const sprintApiConfig = {
  // -- CRUD --
  list: {
    path: SprintListURL,
    method: 'get',
    schemas: { query: ZSprintListQuery, response: z.object({ data: ZSprintResponse.array() }) },
  },
  create: {
    path: SprintListURL,
    method: 'post',
    schemas: { body: ZSprintCreateInput, response: ZSprintResponse },
  },
  get: {
    path: SprintItemURL,
    method: 'get',
    schemas: { response: ZSprintDetailResponse },
  },
  update: {
    path: SprintItemURL,
    method: 'patch',
    schemas: { body: ZSprintUpdateInput, response: ZSprintResponse },
  },
  delete: {
    path: SprintItemURL,
    method: 'delete',
  },

  // -- Lifecycle --
  start: {
    path: `${SprintItemURL}/start` as const,
    method: 'post',
    schemas: { body: z.any() },
  },
  complete: {
    path: `${SprintItemURL}/complete` as const,
    method: 'post',
    schemas: { body: ZSprintCompleteInput },
  },

  // -- Issues --
  listIssues: {
    path: SprintIssuesURL,
    method: 'get',
    schemas: { response: ZBoardIssueList },
  },
  addIssues: {
    path: SprintIssuesURL,
    method: 'post',
    schemas: { body: ZSprintAddIssuesInput },
  },
  removeIssue: {
    path: SprintIssueItemURL,
    method: 'delete',
  },

  // -- Reports & Analytics --
  reports: {
    path: `${SprintItemURL}/reports` as const,
    method: 'get',
  },
  summary: {
    path: `${SprintItemURL}/summary` as const,
    method: 'get',
    schemas: { response: ZSprintSummary },
  },
  analytics: {
    path: `${SprintItemURL}/analytics` as const,
    method: 'get',
    schemas: { response: ZSprintAnalyticsResponse },
  },

  // -- User Preferences --
  getPreferences: {
    path: `${SprintItemURL}/user-preferences` as const,
    method: 'get',
  },
  updatePreferences: {
    path: `${SprintItemURL}/user-preferences` as const,
    method: 'patch',
    schemas: { body: ZSprintUserPreferenceInput },
  },

  // -- Transfer --
  transfer: {
    path: `${SprintItemURL}/transfer` as const,
    method: 'post',
    schemas: { body: ZSprintTransferInput },
  },
} satisfies ConfigTree;

export const sprintApi = buildApi(sprintApiConfig);
