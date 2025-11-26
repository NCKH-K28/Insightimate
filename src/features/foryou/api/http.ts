import { PathParams, baseApi } from '@/lib/api/_client';

const Base = `v2/workspaces/{workspaceId}/foryou` as const;
const Worked = `${Base}/worked` as const;
const Viewed = `${Base}/viewed` as const;
const View = `${Base}/viewed` as const;

export type ForYouCtx = PathParams<typeof Base>;

const ForYouEndpoints = {
  worked: Worked,
  assigned: `${Base}/assigned` as const,
  viewed: Viewed,
  view: View,
} as const;

export const foryouApi = {
  worked: (ctx: ForYouCtx) => baseApi.get<{ items: any[] }>(ForYouEndpoints.worked, ctx),
  assigned: (ctx: ForYouCtx) => baseApi.get<{ items: any[] }>(ForYouEndpoints.assigned, ctx),
  viewed: (ctx: ForYouCtx) => baseApi.get<{ items: any[] }>(ForYouEndpoints.viewed, ctx),
  view: (ctx: ForYouCtx, data: { type: 'ISSUE' | 'PROJECT'; entityId: string; context?: any }) =>
    baseApi.post<{ ok: boolean }>(ForYouEndpoints.view, data, ctx),
};

export default foryouApi;
