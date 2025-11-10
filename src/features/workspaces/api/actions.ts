 

'use client';

import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { createApiMutationFc } from '@/lib/utils/api';
import { workspaceApi } from './http';

type WsCtx = { workspaceId: string };
type WsPrjCtx = { workspaceId: string; projectId: string };
type WsMemCtx = { workspaceId: string; memberId: string };

// ============== Workspaces ==============
export const listWorkspacesQueryOptions = () => {
  return queryOptions({
    queryKey: ['workspaces'],
    queryFn: () => workspaceApi.list({}, {}),
    select: (res) => res.data,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const getWorkspaceQueryOptions = (ctx: WsCtx) => {
  return queryOptions({
    queryKey: ['workspaces', ctx],
    queryFn: async () => workspaceApi.get(ctx, {}),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const deleteWorkspaceMutationOptions = (ctx: WsCtx) => {
  return mutationOptions({
    mutationKey: ['workspaces', ctx.workspaceId, 'delete'],
    mutationFn: createApiMutationFc(ctx, workspaceApi.delete),
    meta: { invalidateQueries: [['workspaces']] },
  });
};

export const updateWorkspaceMutationOptions = (ctx: WsCtx) => {
  return mutationOptions({
    mutationKey: ['workspaces', ctx.workspaceId, 'update'],
    mutationFn: createApiMutationFc(ctx, workspaceApi.update),
    meta: { invalidateQueries: [['workspaces'], ['workspaces', ctx.workspaceId]] },
  });
};

// ============== Workspace Projects ==============
export const listWsProjsQueryOptions = (ctx: WsPrjCtx) => {
  return queryOptions({
    queryKey: ['workspaces', ctx.workspaceId, 'projects'],
    queryFn: () => workspaceApi.project.list(ctx, {}),
  });
};

export const fetchWsProjFacetsQueryOptions = (ctx: WsCtx) => {
  return queryOptions({
    queryKey: ['workspaces', ctx.workspaceId, 'projects', 'facets'],
    queryFn: async () => workspaceApi.project.getFacets(ctx, {}),
  });
};

export const fetchWorkspaceMembersQueryOptions = (ctx: WsCtx) => {
  return queryOptions({
    queryKey: ['workspaces', ctx.workspaceId, 'members'],
    queryFn: async () => workspaceApi.member.list(ctx, {}),
    select: (res) => res.data,
    staleTime: 1000 * 60 * 5,
  });
};

export const createWorkspaceMutationOptions = () => {
  return mutationOptions({
    mutationFn: createApiMutationFc({}, workspaceApi.create),
    meta: { invalidateQueries: [['workspaces']] },
  });
};

// ============== Workspace Members ==============
export const inviteWorkspaceMemberMutationOptions = (ctx: { workspaceId: string }) => {
  return mutationOptions({
    mutationFn: createApiMutationFc(ctx, workspaceApi.member.invite),
    meta: { invalidateQueries: [['workspaces', ctx.workspaceId, 'members']] },
  });
};

export const assignWorkspaceMemberRoleMutationOptions = (ctx: WsMemCtx) => {
  return mutationOptions({
    mutationKey: ['workspaces', ctx.workspaceId, 'members', ctx.memberId, 'assign_role'],
    mutationFn: createApiMutationFc(ctx, workspaceApi.member.assignRole),
    meta: { invalidateQueries: [['workspaces', ctx.workspaceId, 'members']] },
  });
};

export const listWsMembersQueryOptions = (ctx: WsCtx) => {
  return queryOptions({
    queryKey: ['workspaces', ctx.workspaceId, 'members'],
    queryFn: () => workspaceApi.member.list(ctx, {}),
    select: (res) => res.data,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const deleteWorkspaceMemberMutationOptions = (ctx: WsMemCtx) => {
  return mutationOptions({
    mutationKey: ['workspaces', ctx.workspaceId, 'members', ctx.memberId, 'delete'],
    mutationFn: createApiMutationFc(ctx, workspaceApi.member.delete),
    meta: { invalidateQueries: [['workspaces', ctx.workspaceId, 'members']] },
  });
};

export const updateWorkspaceMemberMutationOptions = (ctx: WsMemCtx) => {
  return mutationOptions({
    mutationKey: ['workspaces', ctx.workspaceId, 'members', ctx.memberId, 'update'],
    mutationFn: createApiMutationFc(ctx, workspaceApi.member.update),
    meta: { invalidateQueries: [['workspaces', ctx.workspaceId, 'members']] },
  });
};

export const updateWorkspaceMembersMutationOptions = (ctx: WsCtx) => {
  return mutationOptions({
    mutationKey: ['workspaces', ctx.workspaceId, 'members', 'update'],
    mutationFn: async ([memberId, data]: [string, any]) => {
      return workspaceApi.member.update({ workspaceId: ctx.workspaceId, memberId }, data);
    },
    meta: { invalidateQueries: [['workspaces', ctx.workspaceId, 'members']] },
  });
};
