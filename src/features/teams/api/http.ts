import { TeamItem, TeamList, TeamMemberAddInput, TeamUpdateInput } from '@/contracts/teams';
import { PathParams, baseApi } from '@/lib/api/_client';

const TeamBaseURL = 'v2/teams' as const;
const TeamItemURL = `${TeamBaseURL}/{teamId}` as const;
const TeamMemberBase = `${TeamItemURL}/members` as const;
const TeamMemberItem = `${TeamMemberBase}/{memberId}` as const;

const TeamEndpoints = {
  list: TeamBaseURL,
  create: TeamBaseURL,
  get: TeamItemURL,
  delete: TeamItemURL,
  update: TeamItemURL,

  links: {
    list: `${TeamItemURL}/links`,
  },

  members: {
    list: TeamMemberBase,
    add: TeamMemberBase,
    remove: TeamMemberItem,
    update: TeamMemberItem,
  },

  // === Deprecated ===
  member: {
    list: TeamMemberBase,
    add: TeamMemberBase,
    remove: TeamMemberItem,
    update: TeamMemberItem,
  },
} as const;

type TeamCtx = PathParams<typeof TeamItemURL>;
type TeamMemberCtx = PathParams<typeof TeamMemberItem>;
export const teamApi = {
  list: () => baseApi.get<TeamList>(TeamEndpoints.list),
  get: (ctx: TeamCtx) => baseApi.get<TeamItem>(TeamEndpoints.get, ctx),
  create: (data: any) => baseApi.post(TeamEndpoints.create, data),
  delete: (ctx: TeamCtx) => baseApi.delete(TeamEndpoints.delete, ctx),
  update: (ctx: TeamCtx, data: TeamUpdateInput) =>
    baseApi.patch<TeamItem>(TeamEndpoints.update, data, ctx),

  members: {
    list: (ctx: TeamCtx) => baseApi.get<TeamItem>(TeamEndpoints.members.list, ctx),
    add: (ctx: TeamCtx, data: TeamMemberAddInput) =>
      baseApi.post(TeamEndpoints.members.add, data, ctx),
    remove: (ctx: TeamMemberCtx) => baseApi.delete(TeamEndpoints.members.remove, ctx),
    update: (ctx: TeamMemberCtx, data: any) =>
      baseApi.patch(TeamEndpoints.members.update, data, ctx),
  },

  // === Deprecated ===
  member: {
    list: (ctx: TeamCtx) => baseApi.get(TeamEndpoints.member.list, ctx),
    add: (ctx: TeamCtx, data: TeamMemberAddInput) =>
      baseApi.post(TeamEndpoints.member.add, data, ctx),
    remove: (ctx: TeamMemberCtx) => baseApi.delete(TeamEndpoints.member.remove, ctx),
    update: (ctx: TeamMemberCtx, data: any) =>
      baseApi.patch(TeamEndpoints.member.update, data, ctx),
  },

  links: {
    list: (ctx: TeamCtx) => baseApi.get(TeamEndpoints.links.list, ctx),
  },
};
