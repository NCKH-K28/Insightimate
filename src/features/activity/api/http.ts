import { ActivityFeedQuery, ActivityFeedResponse } from '@/contracts/activity';
import { baseApi } from '@/lib/api/_client';

const BaseActivity = `v3/activity` as const;

const ActivityEndpoints = {
  list: BaseActivity,
} as const;

export const activityApi = {
  list: (params?: ActivityFeedQuery) =>
    baseApi.get<ActivityFeedResponse>(ActivityEndpoints.list, undefined, { params }),
};
