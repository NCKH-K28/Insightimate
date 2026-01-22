import { queryOptions } from '@tanstack/react-query';
import { orgAPI } from './http';

export const getOrgQueryOptions = (params: { id: string; by?: 'id' | 'slug' }) => {
  return queryOptions({
    queryKey: ['orgs', params.id],
    queryFn: async () => orgAPI.get(params.id, params.by),
    staleTime: 1000 * 60 * 5,
  });
};
