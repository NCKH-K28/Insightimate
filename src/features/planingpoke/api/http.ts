import { PathParams, baseApi } from '@/lib/api/_client';
import {
  PokerSessionCreateApiInput,
  PokerSessionStartInput,
  PokerStoryCreateInput,
  PokerStoryBulkCreateInput,
  PokerStoryRevealInput,
  PokerVoteSubmitInput,
} from '../types/inputs';

const Base = `v2/poker-sessions` as const;
const Item = `${Base}/{sessionId}` as const;
const Stories = `${Item}/stories` as const;
const StoryItem = `${Stories}/{storyId}` as const;
const Participants = `${Item}/participants` as const;
const Start = `${Item}/start` as const;
const Complete = `${Item}/complete` as const;
const HostCandidates =
  `v2/workspaces/{workspaceId}/poker-host-candidates` as const;

export type PokerSessionCtx = PathParams<typeof Item>;
export type PokerStoryCtx = PathParams<typeof StoryItem>;

export const planingPokeApi = {
  // sessions
  list: (params: { workspaceId: string }) =>
    baseApi.get<{ data: any[]; meta: { total: number } }>(Base, undefined, { params }),
  get: (ctx: PokerSessionCtx) => baseApi.get<any>(Item, ctx),
  create: (data: PokerSessionCreateApiInput) => baseApi.post<any>(Base, data),
  start: (ctx: PokerSessionCtx, data: PokerSessionStartInput) =>
    baseApi.post<any>(Start, data, ctx),
  complete: (ctx: PokerSessionCtx) => baseApi.post<any>(Complete, undefined, ctx),

  // stories
  listStories: (ctx: PokerSessionCtx) =>
    baseApi.get<{ data: any[]; meta: { total: number } }>(Stories, ctx),
  addStory: (ctx: PokerSessionCtx, data: PokerStoryCreateInput) =>
    baseApi.post<any>(Stories, data, ctx),
  addStoriesBulk: (ctx: PokerSessionCtx, data: PokerStoryBulkCreateInput) =>
    baseApi.post<any>(Stories, data, ctx),
  removeStory: (ctx: PokerStoryCtx) => baseApi.delete<any>(StoryItem, ctx),

  // votes / reveal
  submitVote: (ctx: PokerStoryCtx, data: PokerVoteSubmitInput) =>
    baseApi.post<any>(StoryItem, data, ctx),
  confirmVote: (ctx: PokerStoryCtx) =>
    baseApi.post<any>(`${StoryItem}?action=confirm` as const, undefined, ctx),
  clearVote: (ctx: PokerStoryCtx) =>
    baseApi.post<any>(`${StoryItem}?action=clear` as const, undefined, ctx),
  revealStory: (ctx: PokerStoryCtx, data?: PokerStoryRevealInput) =>
    baseApi.post<any>(`${StoryItem}?action=reveal` as const, data ?? {}, ctx),

  // participants
  listParticipants: (ctx: PokerSessionCtx) =>
    baseApi.get<{ data: any[]; meta: { total: number } }>(Participants, ctx),
  joinSession: (ctx: PokerSessionCtx) =>
    baseApi.post<any>(Participants, undefined, ctx),

  // hosts
  listHostCandidates: (ctx: { workspaceId: string }) =>
    baseApi.get<{ data: any[] }>(HostCandidates, ctx),
};
