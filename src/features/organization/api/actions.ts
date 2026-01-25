import { queryOptions, useQueryClient } from '@tanstack/react-query';
import { orgAPI } from './http';

export const orgKeys = {
  all: ['orgs'] as const,
  lists: () => [...orgKeys.all, 'list'] as const,
  details: () => [...orgKeys.all, 'detail'] as const,
  list: (filters: Record<string, any>) => [...orgKeys.lists(), { filters }] as const,
  detail: (params: { id: string; by?: 'id' | 'slug' }) =>
    [...orgKeys.details(), { params }] as const,
};

export const listOrgsQueryOptions = () => {
  return queryOptions({
    queryKey: orgKeys.lists(),
    queryFn: async () => orgAPI.list(),
    staleTime: 1000 * 60 * 5,
  });
};

export const getOrgQueryOptions = (params: { id: string; by?: 'id' | 'slug' }) => {
  return queryOptions({
    queryKey: orgKeys.detail(params),
    queryFn: async () => orgAPI.get(params.id, params.by),
    staleTime: 1000 * 60 * 5,
  });
};
