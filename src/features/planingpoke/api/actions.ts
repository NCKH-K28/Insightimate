import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { planingPokeApi } from './http';
import type {
  PokerSessionCreateApiInput,
  PokerSessionStartInput,
  PokerStoryBulkCreateInput,
  PokerStoryCreateInput,
  PokerStoryRevealInput,
  PokerVoteSubmitInput,
} from '../types/inputs';

const KEY = 'poker-sessions';

// ---------- Queries ----------
export const listPokerSessionsQueryOptions = (params: { workspaceId: string }) =>
  queryOptions({
    queryKey: [KEY, 'list', params],
    queryFn: () => planingPokeApi.list(params),
    select: (res) => res.data,
    enabled: !!params.workspaceId,
  });

export const getPokerSessionQueryOptions = (params: { sessionId: string }) =>
  queryOptions({
    queryKey: [KEY, params.sessionId],
    queryFn: () => planingPokeApi.get(params),
    enabled: !!params.sessionId,
    refetchInterval: 3000,
  });

export const listPokerStoriesQueryOptions = (params: { sessionId: string }) =>
  queryOptions({
    queryKey: [KEY, params.sessionId, 'stories'],
    queryFn: () => planingPokeApi.listStories(params),
    select: (res) => res.data,
    enabled: !!params.sessionId,
  });

export const listPokerParticipantsQueryOptions = (params: { sessionId: string }) =>
  queryOptions({
    queryKey: [KEY, params.sessionId, 'participants'],
    queryFn: () => planingPokeApi.listParticipants(params),
    select: (res) => res.data,
    enabled: !!params.sessionId,
    refetchInterval: 3000,
  });

export const listPokerHostCandidatesQueryOptions = (params: { workspaceId: string }) =>
  queryOptions({
    queryKey: [KEY, 'host-candidates', params.workspaceId],
    queryFn: () => planingPokeApi.listHostCandidates(params),
    select: (res) => res.data,
    enabled: !!params.workspaceId,
  });

// ---------- Mutations ----------
export const createPokerSessionMutationOptions = () =>
  mutationOptions({
    mutationKey: [KEY, 'create'],
    mutationFn: (data: PokerSessionCreateApiInput) => planingPokeApi.create(data),
    meta: { invalidateQueries: [[KEY]] },
  });

export const addPokerStoryMutationOptions = (params: { sessionId: string }) =>
  mutationOptions({
    mutationKey: [KEY, params.sessionId, 'stories', 'add'],
    mutationFn: (data: PokerStoryCreateInput) => planingPokeApi.addStory(params, data),
    meta: { invalidateQueries: [[KEY, params.sessionId, 'stories']] },
  });

export const addPokerStoriesBulkMutationOptions = (params: { sessionId: string }) =>
  mutationOptions({
    mutationKey: [KEY, params.sessionId, 'stories', 'bulk'],
    mutationFn: (data: PokerStoryBulkCreateInput) =>
      planingPokeApi.addStoriesBulk(params, data),
    meta: { invalidateQueries: [[KEY, params.sessionId, 'stories']] },
  });

export const removePokerStoryMutationOptions = (params: { sessionId: string }) =>
  mutationOptions({
    mutationKey: [KEY, params.sessionId, 'stories', 'delete'],
    mutationFn: (storyId: string) =>
      planingPokeApi.removeStory({ sessionId: params.sessionId, storyId }),
    meta: { invalidateQueries: [[KEY, params.sessionId, 'stories']] },
  });

export const startPokerSessionMutationOptions = (params: { sessionId: string }) =>
  mutationOptions({
    mutationKey: [KEY, params.sessionId, 'start'],
    mutationFn: (data: PokerSessionStartInput) => planingPokeApi.start(params, data),
    meta: { invalidateQueries: [[KEY, params.sessionId]] },
  });

export const completePokerSessionMutationOptions = (params: { sessionId: string }) =>
  mutationOptions({
    mutationKey: [KEY, params.sessionId, 'complete'],
    mutationFn: () => planingPokeApi.complete(params),
    meta: { invalidateQueries: [[KEY, params.sessionId]] },
  });

export const submitPokerVoteMutationOptions = (params: { sessionId: string; storyId: string }) =>
  mutationOptions({
    mutationKey: [KEY, params.sessionId, params.storyId, 'vote'],
    mutationFn: (data: PokerVoteSubmitInput) => planingPokeApi.submitVote(params, data),
    meta: { invalidateQueries: [[KEY, params.sessionId]] },
  });

export const confirmPokerVoteMutationOptions = (params: { sessionId: string; storyId: string }) =>
  mutationOptions({
    mutationKey: [KEY, params.sessionId, params.storyId, 'confirm'],
    mutationFn: () => planingPokeApi.confirmVote(params),
    meta: { invalidateQueries: [[KEY, params.sessionId]] },
  });

export const clearPokerVoteMutationOptions = (params: { sessionId: string; storyId: string }) =>
  mutationOptions({
    mutationKey: [KEY, params.sessionId, params.storyId, 'clear'],
    mutationFn: () => planingPokeApi.clearVote(params),
    meta: { invalidateQueries: [[KEY, params.sessionId]] },
  });

export const revealPokerStoryMutationOptions = (params: { sessionId: string; storyId: string }) =>
  mutationOptions({
    mutationKey: [KEY, params.sessionId, params.storyId, 'reveal'],
    mutationFn: (data?: PokerStoryRevealInput) => planingPokeApi.revealStory(params, data),
    meta: { invalidateQueries: [[KEY, params.sessionId]] },
  });

export const joinPokerSessionMutationOptions = (params: { sessionId: string }) =>
  mutationOptions({
    mutationKey: [KEY, params.sessionId, 'join'],
    mutationFn: () => planingPokeApi.joinSession(params),
    meta: { invalidateQueries: [[KEY, params.sessionId, 'participants']] },
  });
