import { userApi } from './http';
import { queryOptions } from '@tanstack/react-query';

export const searchUsersQueryOptions = (
  search: string,
  options?: { resourceType: 'WORKSPACE'; resourceId: string },
) => {
  return queryOptions({
    queryKey: ['users', 'search', search],
    queryFn: () => userApi.search({ search, ...options }),
    select: (res) => res.data,
    enabled: search.length > 0,
  });
};
