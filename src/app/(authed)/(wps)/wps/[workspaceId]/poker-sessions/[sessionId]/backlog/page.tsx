'use client';

import { BacklogSelector } from '@/features/planingpoke';
import { MOCK_BACKLOG } from '@/features/planingpoke/utils/mock-backlog';
import {
  addPokerStoriesBulkMutationOptions,
  getPokerSessionQueryOptions,
  listPokerStoriesQueryOptions,
  startPokerSessionMutationOptions,
} from '@/features/planingpoke/api/actions';
import type { PokerBacklogStory, PokerHostCandidate } from '@/features/planingpoke';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function PokerSessionBacklogPage() {
  const params = useParams<{ workspaceId: string; sessionId: string }>();
  const router = useRouter();

  const workspaceId = params?.workspaceId ?? '';
  const sessionId = params?.sessionId ?? '';

  const sessionQuery = useQuery(getPokerSessionQueryOptions({ sessionId }));
  const storiesQuery = useQuery(listPokerStoriesQueryOptions({ sessionId }));

  const session: any = sessionQuery.data;
  const dbStories = storiesQuery.data ?? [];

  const host: PokerHostCandidate = session?.host
    ? {
        id: session.host.id,
        name: session.host.name,
        email: session.host.email,
        avatarUrl: session.host.avatar ?? undefined,
      }
    : { id: 'host', name: 'Host', email: '' };

  const stories: PokerBacklogStory[] =
    dbStories.length > 0
      ? dbStories.map((s: any) => ({
          id: s.id,
          code: s.code,
          title: s.title,
          description: s.description,
          priority: s.priority,
          tags: Array.isArray(s.tags) ? s.tags : [],
          storyPoint: s.finalPoints ?? undefined,
        }))
      : MOCK_BACKLOG;

  const initialSelected =
    dbStories.length > 0 ? dbStories.map((s: any) => s.id) : ['jira-101', 'jira-205'];

  const bulkAdd = useMutation(addPokerStoriesBulkMutationOptions({ sessionId }));
  const startMutation = useMutation(startPokerSessionMutationOptions({ sessionId }));

  const handleStart = async (selectedIds: string[]) => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one story');
      return;
    }

    try {
      let firstStoryId: string;

      if (dbStories.length > 0) {
        firstStoryId = selectedIds[0];
      } else {
        // Bulk-add the selected stories from MOCK_BACKLOG to this session
        const selectedStories = MOCK_BACKLOG.filter((s) => selectedIds.includes(s.id));
        const created: any = await bulkAdd.mutateAsync({
          stories: selectedStories.map((s) => ({
            code: s.code,
            title: s.title,
            description: s.description,
            priority: s.priority,
            tags: s.tags,
          })),
        });
        const createdList = Array.isArray(created) ? created : created?.data ?? [];
        if (!createdList.length) throw new Error('Failed to create stories');
        firstStoryId = createdList[0].id;
      }

      await startMutation.mutateAsync({ storyId: firstStoryId });
      toast.success('Planning Poker started');
      router.push(`/wps/${workspaceId}/poker-sessions/${sessionId}/voting`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Failed to start');
    }
  };

  const handleInvite = () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/wps/${workspaceId}/poker-sessions/${sessionId}/voting`;
    void navigator.clipboard?.writeText(url).catch(() => {});
    toast.success('Invite link copied to clipboard');
  };

  const handleExit = () => {
    router.push(`/wps/${workspaceId}/poker-sessions/create`);
  };

  return (
    <BacklogSelector
      sessionName={session?.name ?? 'Planning Session'}
      host={host}
      stories={stories}
      initialSelectedIds={initialSelected}
      onStart={handleStart}
      onInvite={handleInvite}
      onExit={handleExit}
    />
  );
}
