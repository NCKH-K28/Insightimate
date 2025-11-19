import { PathParams, baseApi } from '@/lib/api/_client';

const Base = `v2/workspaces/{workspaceId}/foryou` as const;
const Worked = `${Base}/worked` as const;

export type ForYouCtx = PathParams<typeof Base>;

const ForYouEndpoints = {
  worked: Worked,
} as const;

export const foryouApi = {
  worked: (ctx: ForYouCtx) => baseApi.get<{ items: any[] }>(ForYouEndpoints.worked, ctx),
};

export default foryouApi;
