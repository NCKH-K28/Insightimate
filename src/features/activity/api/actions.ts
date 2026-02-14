import { infiniteQueryOptions } from '@tanstack/react-query';
import { activityApi } from './http';
import { ActivityFeedQuery } from '@/contracts/activity';

export const activityKeys = {
  all: ['activity'] as const,
  list: (params?: ActivityFeedQuery) => [...activityKeys.all, params] as const,
};

export const activityQueries = {
  list: (params: ActivityFeedQuery) =>
    infiniteQueryOptions({
      queryKey: activityKeys.list(params),
      queryFn: async ({ pageParam }: { pageParam?: string }) => {
        const query = { ...params, cursor: pageParam };
        return activityApi.list(query);
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: undefined as string | undefined,
    }),
};
