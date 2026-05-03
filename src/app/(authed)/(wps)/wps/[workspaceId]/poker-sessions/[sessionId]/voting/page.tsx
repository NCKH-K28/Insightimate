'use client';

import * as React from 'react';
import { ModeratorRoom, VotingRoom } from '@/features/planingpoke';
import {
  clearPokerVoteMutationOptions,
  completePokerSessionMutationOptions,
  confirmPokerVoteMutationOptions,
  getPokerSessionQueryOptions,
  listPokerParticipantsQueryOptions,
  listPokerStoriesQueryOptions,
  resetPokerRoundMutationOptions,
  revealPokerStoryMutationOptions,
  setPokerStoryFinalPointsMutationOptions,
  startPokerSessionMutationOptions,
  submitPokerVoteMutationOptions,
} from '@/features/planingpoke/api/actions';
import { getMeQueryOptions } from '@/features/authn/api/actions';
import type {
  PokerHostCandidate,
  PokerParticipant,
  PokerVotingStory,
  ModeratorParticipantView,
} from '@/features/planingpoke';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function PokerSessionVotingPage() {
  const params = useParams<{ workspaceId: string; sessionId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const workspaceId = params?.workspaceId ?? '';
  const sessionId = params?.sessionId ?? '';

  const meQuery = useQuery(getMeQueryOptions());
  const sessionQuery = useQuery(getPokerSessionQueryOptions({ sessionId }));
  const participantsQuery = useQuery(listPokerParticipantsQueryOptions({ sessionId }));
  const storiesQuery = useQuery(listPokerStoriesQueryOptions({ sessionId }));

  const me: any = meQuery.data;
  const meId: string | undefined = me?.id ?? me?.user?.id;

  const session: any = sessionQuery.data;
  const activeStory: any = session?.activeStory;
  const storyId: string | undefined = activeStory?.id;

  const submitVoteMutation = useMutation(
    submitPokerVoteMutationOptions({ sessionId, storyId: storyId ?? '' }),
  );
  const confirmVoteMutation = useMutation(
    confirmPokerVoteMutationOptions({ sessionId, storyId: storyId ?? '' }),
  );
  const clearVoteMutation = useMutation(
    clearPokerVoteMutationOptions({ sessionId, storyId: storyId ?? '' }),
  );
  const revealMutation = useMutation(
    revealPokerStoryMutationOptions({ sessionId, storyId: storyId ?? '' }),
  );
  const resetMutation = useMutation(
    resetPokerRoundMutationOptions({ sessionId, storyId: storyId ?? '' }),
  );
  const setFinalPointsMutation = useMutation(
    setPokerStoryFinalPointsMutationOptions({ sessionId, storyId: storyId ?? '' }),
  );
  const startMutation = useMutation(startPokerSessionMutationOptions({ sessionId }));
  const completeMutation = useMutation(completePokerSessionMutationOptions({ sessionId }));

  const host: PokerHostCandidate = session?.host
    ? {
        id: session.host.id,
        name: session.host.name,
        email: session.host.email,
        avatarUrl: session.host.avatar ?? undefined,
      }
    : { id: 'host', name: 'Host', email: '' };

  const isHost = !!meId && !!session && meId === session.hostUserId;

  // Voter state derived from server vote (so refresh keeps state).
  const myVote: any =
    activeStory?.votes?.find((v: any) => (v.user?.id ?? v.userId) === meId) ?? null;
  const initialEstimate: string | undefined = myVote?.value;
  const initialConfirmed: boolean = !!myVote?.confirmed;

  const participants: PokerParticipant[] = (participantsQuery.data ?? []).map((p: any) => ({
    id: p.user?.id ?? p.userId,
    name: p.user?.name ?? 'Member',
    email: p.user?.email,
    avatarUrl: p.user?.avatar ?? undefined,
    role: p.role === 'HOST' ? 'Host' : p.role === 'OBSERVER' ? 'Observer' : undefined,
    status: p.status,
  }));

  const revealed = activeStory?.status === 'ESTIMATED';
  const moderatorParticipants: ModeratorParticipantView[] = participants.map((p) => {
    const v = activeStory?.votes?.find((vv: any) => (vv.user?.id ?? vv.userId) === p.id);
    return {
      ...p,
      revealedValue: revealed && v ? String(v.value) : undefined,
    };
  });

  // Numeric min/max from current votes
  const numericVotes: number[] = (activeStory?.votes ?? [])
    .map((v: any) => Number(v.value))
    .filter((n: number) => Number.isFinite(n));
  const minVote = numericVotes.length ? Math.min(...numericVotes) : null;
  const maxVote = numericVotes.length ? Math.max(...numericVotes) : null;

  const story: PokerVotingStory & { description?: string; acceptanceCriteria?: string[] } =
    activeStory
      ? {
          code: activeStory.code,
          title: activeStory.title,
          description: activeStory.description ?? undefined,
          source: 'Sprint Backlog',
          acceptanceCriteria: parseAcceptanceCriteria(activeStory.description),
        }
      : { code: '—', title: 'No story selected', source: 'Idle' };

  const handleInvite = () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/wps/${workspaceId}/poker-sessions/${sessionId}/voting`;
    void navigator.clipboard?.writeText(url).catch(() => {});
    toast.success('Invite link copied to clipboard');
  };

  const handleExit = () => {
    router.push(`/wps/${workspaceId}/poker-sessions/${sessionId}/backlog`);
  };

  const handleSelectCard = async (estimate: string) => {
    if (!storyId) return;
    try {
      await submitVoteMutation.mutateAsync({ value: estimate });
      queryClient.invalidateQueries({ queryKey: ['poker-sessions', sessionId] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Vote failed');
    }
  };

  const handleConfirmVote = async () => {
    if (!storyId) return;
    try {
      await confirmVoteMutation.mutateAsync();
      queryClient.invalidateQueries({ queryKey: ['poker-sessions', sessionId] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Confirm failed');
    }
  };

  const handleClearVote = async () => {
    if (!storyId) return;
    try {
      await clearVoteMutation.mutateAsync();
      queryClient.invalidateQueries({ queryKey: ['poker-sessions', sessionId] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Clear failed');
    }
  };

  const handleReveal = async () => {
    if (!storyId) return;
    try {
      const result: any = await revealMutation.mutateAsync(undefined);
      toast.success(
        result?.finalPoints != null
          ? `Revealed. Avg = ${result.finalPoints}`
          : 'Votes revealed',
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Reveal failed');
    }
  };

  const handleReset = async () => {
    if (!storyId) return;
    try {
      await resetMutation.mutateAsync();
      toast.success('Round reset');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Reset failed');
    }
  };

  const handleNextStory = async () => {
    const stories: any[] = storiesQuery.data ?? [];
    const next = stories.find((s) => s.status === 'PENDING' && s.id !== storyId);
    if (!next) {
      toast.info('No more pending stories. Completing session.');
      await completeMutation.mutateAsync();
      router.push(`/wps/${workspaceId}/poker-sessions/${sessionId}/backlog`);
      return;
    }
    await startMutation.mutateAsync({ storyId: next.id });
    toast.success(`Now voting: ${next.code}`);
  };

  const handleSaveAndNext = async (finalPoints: number) => {
    if (!storyId) return;
    try {
      await setFinalPointsMutation.mutateAsync({ finalPoints });
      toast.success(`Saved estimate: ${finalPoints}`);
      await handleNextStory();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Save failed');
    }
  };

  const handleTabChange = (tab: 'voting' | 'backlog' | 'participants' | string) => {
    if (tab === 'backlog') {
      router.push(`/wps/${workspaceId}/poker-sessions/${sessionId}/backlog`);
    } else if (tab === 'participants') {
      router.push(`/wps/${workspaceId}/poker-sessions/${sessionId}/participants`);
    }
  };

  if (isHost) {
    return (
      <div className='relative h-screen w-full'>
        <ModeratorRoom
          sessionName={session?.name ?? 'Planning Session'}
          host={host}
          story={story}
          deckType={session?.deckType ?? 'FIBONACCI'}
          participants={moderatorParticipants}
          totalSeats={participants.length || undefined}
          revealed={revealed}
          finalPoints={activeStory?.finalPoints ?? null}
          minVote={minVote}
          maxVote={maxVote}
          roundStartedAt={
            activeStory
              ? new Date(activeStory.updatedAt ?? activeStory.createdAt).getTime()
              : undefined
          }
          busyReveal={revealMutation.isPending}
          busyReset={resetMutation.isPending}
          busySave={setFinalPointsMutation.isPending || startMutation.isPending}
          moderatorEstimate={initialEstimate}
          onInvite={handleInvite}
          onExit={handleExit}
          onReveal={handleReveal}
          onReset={handleReset}
          onSaveAndNext={handleSaveAndNext}
          onRevote={handleReset}
          onTabChange={handleTabChange}
          onModeratorVote={handleSelectCard}
        />
      </div>
    );
  }

  return (
    <div className='relative h-screen w-full'>
      <VotingRoom
        sessionName={session?.name ?? 'Planning Session'}
        host={host}
        story={story}
        deckType={session?.deckType ?? 'FIBONACCI'}
        participants={participants}
        initialEstimate={initialEstimate}
        initialConfirmed={initialConfirmed}
        onInvite={handleInvite}
        onExit={handleExit}
        onSelectCard={handleSelectCard}
        onConfirmVote={handleConfirmVote}
        onClearVote={handleClearVote}
        onTabChange={handleTabChange}
      />
    </div>
  );
}

/** Best-effort parse of "Acceptance Criteria" bullet list from a description string. */
function parseAcceptanceCriteria(desc?: string | null): string[] | undefined {
  if (!desc) return undefined;
  const idx = desc.toLowerCase().indexOf('acceptance criteria');
  if (idx < 0) return undefined;
  const tail = desc.slice(idx).split(/\r?\n/).slice(1);
  const items = tail
    .map((l) => l.trim())
    .filter((l) => l.startsWith('-') || l.startsWith('*') || /^\d+\./.test(l))
    .map((l) => l.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, ''));
  return items.length ? items : undefined;
}
