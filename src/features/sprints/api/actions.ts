import { queryOptions, mutationOptions } from '@tanstack/react-query';
import { sprintApi } from './http';
import type { SprintDetailResponse } from './http';
import type {
  SprintUpdateInput,
  SprintCompleteInput,
  SprintAddIssuesInput,
  SprintTransferInput,
  SprintUserPreferenceInput,
} from '@/contracts/sprints';

// ========== Query Options ==========

/** Fetch a single sprint with aggregations */
export const sprintDetailQueryOptions = (sprintId: string) =>
  queryOptions({
    queryKey: ['sprint', sprintId],
    queryFn: () => sprintApi.get({ sprintId }, {}),
    staleTime: 1000 * 30, // 30s
    select: (res: any) => res,
  });

/** Fetch issues belonging to a sprint */
export const sprintIssuesQueryOptions = (sprintId: string) =>
  queryOptions({
    queryKey: ['sprint-issues', sprintId],
    queryFn: () => sprintApi.listIssues({ sprintId }, {}),
    staleTime: 1000 * 10, // 10s
    select: (res: any) => res.data,
  });

/** Fetch sprint summary (breakdowns, counts, points) */
export const sprintSummaryQueryOptions = (sprintId: string) =>
  queryOptions({
    queryKey: ['sprint-summary', sprintId],
    queryFn: () => sprintApi.summary({ sprintId }, {}),
    staleTime: 1000 * 60, // 60s
    select: (res: any) => res,
  });

/** Fetch burndown/burnup reports */
export const sprintReportsQueryOptions = (
  sprintId: string,
  type: 'burndown' | 'burnup' = 'burndown',
) =>
  queryOptions({
    queryKey: ['sprint-reports', sprintId, type],
    queryFn: () => sprintApi.reports({ sprintId }, { params: { type } }),
    staleTime: 1000 * 60, // 60s
    select: (res: any) => res,
  });

/** Fetch sprint analytics (distributions + burndown) */
export const sprintAnalyticsQueryOptions = (sprintId: string) =>
  queryOptions({
    queryKey: ['sprint-analytics', sprintId],
    queryFn: () => sprintApi.analytics({ sprintId }, {}),
    staleTime: 1000 * 60, // 60s
    select: (res: any) => res,
  });

/** Fetch user preferences for a sprint */
export const sprintPrefsQueryOptions = (sprintId: string) =>
  queryOptions({
    queryKey: ['sprint-prefs', sprintId],
    queryFn: () => sprintApi.getPreferences({ sprintId }, {}),
    staleTime: Infinity,
    select: (res: any) => res,
  });

/** List sprints by board or project */
export const sprintListQueryOptions = (params: {
  boardId?: string;
  projectId?: string;
  state?: 'FUTURE' | 'ACTIVE' | 'CLOSED';
}) =>
  queryOptions({
    queryKey: ['sprints', params],
    queryFn: () => sprintApi.list({}, params as any),
    staleTime: 1000 * 30,
    select: (res: any) => res.data,
  });

// ========== Mutation Options ==========

/** Update sprint metadata (name, goal, dates) */
export const updateSprintMutationOptions = (sprintId: string) =>
  mutationOptions({
    mutationKey: ['sprint', sprintId, 'update'],
    mutationFn: (data: SprintUpdateInput) => sprintApi.update({ sprintId }, data),
    meta: {
      invalidateQueries: [['sprint', sprintId], ['sprint-summary', sprintId]],
    },
  });

/** Delete a sprint */
export const deleteSprintMutationOptions = (sprintId: string) =>
  mutationOptions({
    mutationKey: ['sprint', sprintId, 'delete'],
    mutationFn: () => sprintApi.delete({ sprintId }, {}),
    meta: {
      invalidateQueries: [['sprints']],
    },
  });

/** Start a sprint (FUTURE → ACTIVE) */
export const startSprintMutationOptions = (sprintId: string) =>
  mutationOptions({
    mutationKey: ['sprint', sprintId, 'start'],
    mutationFn: () => sprintApi.start({ sprintId }, {}),
    meta: {
      invalidateQueries: [
        ['sprint', sprintId],
        ['sprint-issues', sprintId],
        ['sprints'],
      ],
    },
  });

/** Complete a sprint (ACTIVE → CLOSED) */
export const completeSprintMutationOptions = (sprintId: string) =>
  mutationOptions({
    mutationKey: ['sprint', sprintId, 'complete'],
    mutationFn: (data: SprintCompleteInput) => sprintApi.complete({ sprintId }, data),
    meta: {
      invalidateQueries: [
        ['sprint', sprintId],
        ['sprint-issues', sprintId],
        ['sprints'],
      ],
    },
  });

/** Add issues to sprint */
export const addIssuesToSprintMutationOptions = (sprintId: string) =>
  mutationOptions({
    mutationKey: ['sprint', sprintId, 'issues', 'add'],
    mutationFn: (data: SprintAddIssuesInput) => sprintApi.addIssues({ sprintId }, data),
    meta: {
      invalidateQueries: [
        ['sprint-issues', sprintId],
        ['sprint', sprintId],
        ['sprint-summary', sprintId],
      ],
    },
  });

/** Remove an issue from sprint */
export const removeIssueFromSprintMutationOptions = (sprintId: string) =>
  mutationOptions({
    mutationKey: ['sprint', sprintId, 'issues', 'remove'],
    mutationFn: (issueId: string) => sprintApi.removeIssue({ sprintId, issueId }, {}),
    meta: {
      invalidateQueries: [
        ['sprint-issues', sprintId],
        ['sprint', sprintId],
        ['sprint-summary', sprintId],
      ],
    },
  });

/** Transfer incomplete issues to another sprint */
export const transferIssuesMutationOptions = (sprintId: string) =>
  mutationOptions({
    mutationKey: ['sprint', sprintId, 'transfer'],
    mutationFn: (data: SprintTransferInput) => sprintApi.transfer({ sprintId }, data),
    meta: {
      invalidateQueries: [
        ['sprint-issues', sprintId],
        ['sprint', sprintId],
        ['sprints'],
      ],
    },
  });

/** Update user preferences for a sprint (view mode, filters, sort) */
export const updateSprintPrefsMutationOptions = (sprintId: string) =>
  mutationOptions({
    mutationKey: ['sprint', sprintId, 'prefs', 'update'],
    mutationFn: (data: SprintUserPreferenceInput) =>
      sprintApi.updatePreferences({ sprintId }, data),
    meta: {
      invalidateQueries: [['sprint-prefs', sprintId]],
    },
  });
