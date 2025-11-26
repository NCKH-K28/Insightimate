import { BoardIssueMoveInput, BoardIssueUpdateInput } from '@/contracts/boards/boards.input';
import { createApiMutationFc } from '@/lib/utils/api';
import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { boardApi } from './http';
import { BoardIssueQueryParams } from '@/contracts/boards/boards.query';

export const getBoardQueryOptions = (boardId: string) =>
  queryOptions({
    queryKey: ['boards', boardId],
    queryFn: () => boardApi.get({ boardId }, {}),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

// ========= BOARD ISSUES ==========
type BoardIssueContext = Parameters<typeof boardApi.issues.update>[0];
export const listBoardIssuesQueryOptions = (boardId: string, params?: BoardIssueQueryParams) =>
  queryOptions({
    queryKey: ['boards', boardId, 'issues', params],
    queryFn: () => boardApi.issues.list({ boardId }, params),
    staleTime: 1000 * 60 * 2, // 2 minutes
    select: (res) => res.data,
  });

export const getBoardIssueQueryOptions = (context: BoardIssueContext) => {
  return queryOptions({
    queryKey: ['boards', context.boardId, 'issues', context.issueId],
    queryFn: () => boardApi.issues.get(context, {}),
    staleTime: 1000 * 60 * 5,
  });
};

export const getBoardIssueFacetsQueryOptions = (boardId: string) => {
  return queryOptions({
    queryKey: ['boards', boardId, 'issues', 'facets'],
    queryFn: () => boardApi.issues.facets({ boardId }, {}),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const createBoardIssueMutationOptions = (ctx: string | { boardId: string }) => {
  const boardId = typeof ctx === 'string' ? ctx : ctx.boardId;
  return mutationOptions({
    mutationKey: ['boards', boardId, 'issues', 'create'],
    // mutationFn: createApiMutationFc({ boardId }, boardApi.issues.create),
    mutationFn: (data: BoardIssueUpdateInput & { boardId?: string }) => {
      const bId = data.boardId || boardId;
      if (!bId) throw new Error('Board ID is required to create an issue');
      return boardApi.issues.create({ boardId: bId }, data);
    },
    meta: { invalidateQueries: [['boards', boardId, 'issues']] },
  });
};

export const updateBoardIssueMutationOptions = (context: BoardIssueContext) => {
  return mutationOptions({
    mutationKey: ['boards', context.boardId, 'issues', context.issueId, 'update'],
    mutationFn: (data: BoardIssueUpdateInput & { issueId?: string }) => {
      const issueId = data.issueId || context.issueId;
      if (!issueId) throw new Error('Issue ID is required to update an issue');
      return boardApi.issues.update({ ...context, issueId }, data);
    },
    meta: { invalidateQueries: [['boards', context.boardId, 'issues']] },
  });
};

export const deleteBoardIssueMutationOptions = (context: BoardIssueContext) => {
  return mutationOptions({
    mutationKey: ['boards', context.boardId, 'issues', context.issueId, 'delete'],
    mutationFn: createApiMutationFc(context, boardApi.issues.delete),
    meta: { invalidateQueries: [['boards', context.boardId, 'issues']] },
  });
};

export const moveBoardIssueMutationOptions = (contex: { boardId: string; issueId?: string }) => {
  return mutationOptions({
    mutationKey: ['boards', 'issues', 'move', contex.boardId, contex.issueId],
    mutationFn: (data: BoardIssueMoveInput & { issueId?: string }) => {
      const issueId = data.issueId || contex.issueId;
      if (!issueId) throw new Error('Issue ID is required to move an issue');
      return boardApi.issues.move({ boardId: contex.boardId, issueId }, data);
    },
    meta: { invalidateQueries: [['boards', contex.boardId, 'issues']] },
  });
};

// ========= BOARD SPRINTS ==========
export const createBoardSprintMutationOptions = (boardId: string) => {
  return mutationOptions({
    mutationKey: ['boards', boardId, 'sprints', 'create'],
    mutationFn: createApiMutationFc({ boardId }, boardApi.sprints.create),
    meta: { invalidateQueries: [['boards', boardId]] },
  });
};

export const updateBoardSprintMutationOptions = (context: {
  boardId: string;
  sprintId: string;
}) => {
  return mutationOptions({
    mutationKey: ['boards', context.boardId, 'sprints', context.sprintId, 'update'],
    mutationFn: createApiMutationFc(context, boardApi.sprints.update),
    meta: { invalidateQueries: [['boards', context.boardId]] },
  });
};

export const deleteBoardSprintMutationOptions = (context: {
  boardId: string;
  sprintId: string;
}) => {
  return mutationOptions({
    mutationKey: ['boards', context.boardId, 'sprints', context.sprintId, 'delete'],
    mutationFn: createApiMutationFc(context, boardApi.sprints.delete),
    meta: { invalidateQueries: [['boards', context.boardId]] },
  });
};

export const startBoardSprintMutationOptions = (context: { boardId: string; sprintId: string }) => {
  return mutationOptions({
    mutationKey: ['boards', context.boardId, 'sprints', context.sprintId, 'start'],
    mutationFn: createApiMutationFc(context, boardApi.sprints.start),
    meta: { invalidateQueries: [['boards', context.boardId]] },
  });
};

export const completeBoardSprintMutationOptions = (context: {
  boardId: string;
  sprintId: string;
}) => {
  return mutationOptions({
    mutationKey: ['boards', context.boardId, 'sprints', context.sprintId, 'complete'],
    mutationFn: createApiMutationFc(context, boardApi.sprints.complete),
    meta: {
      invalidateQueries: [
        ['boards', context.boardId],
        ['boards', context.boardId, 'issues'],
      ],
    },
  });
};

export const getBoardSprintIssuesQueryOptions = (context: {
  boardId: string;
  sprintId: string;
}) => {
  return queryOptions({
    queryKey: ['boards', context.boardId, 'sprints', context.sprintId, 'issues'],
    queryFn: () => boardApi.sprints.get(context, {}),
    select: (res) =>
      res as {
        name: string;
        [key: string]: unknown;
        _aggregations?: Record<string, unknown>;
        _counts?: Record<string, unknown>;
      },
  });
};
