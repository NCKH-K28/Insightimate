'use client';

import { VotingRoom } from '@/features/planingpoke';
import {
  completePokerSessionMutationOptions,
  getPokerSessionQueryOptions,
  listPokerParticipantsQueryOptions,
  revealPokerStoryMutationOptions,
  startPokerSessionMutationOptions,
  submitPokerVoteMutationOptions,
  confirmPokerVoteMutationOptions,
  listPokerStoriesQueryOptions,
} from '@/features/planingpoke/api/actions';
import type {
  PokerHostCandidate,
  PokerParticipant,
  PokerVotingStory,
} from '@/features/planingpoke';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Eye, SkipForward, CheckCircle2 } from 'lucide-react';

export default function PokerSessionVotingPage() {
  const params = useParams<{ workspaceId: string; sessionId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const workspaceId = params?.workspaceId ?? '';
  const sessionId = params?.sessionId ?? '';

  const sessionQuery = useQuery(getPokerSessionQueryOptions({ sessionId }));
  const participantsQuery = useQuery(listPokerParticipantsQueryOptions({ sessionId }));
  const storiesQuery = useQuery(listPokerStoriesQueryOptions({ sessionId }));

  const session: any = sessionQuery.data;
  const activeStory: any = session?.activeStory;
  const storyId: string | undefined = activeStory?.id;

  const submitVoteMutation = useMutation(
    submitPokerVoteMutationOptions({ sessionId, storyId: storyId ?? '' }),
  );
  const confirmVoteMutation = useMutation(
    confirmPokerVoteMutationOptions({ sessionId, storyId: storyId ?? '' }),
  );
  const revealMutation = useMutation(
    revealPokerStoryMutationOptions({ sessionId, storyId: storyId ?? '' }),
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

  const participants: PokerParticipant[] = (participantsQuery.data ?? []).map(
    (p: any) => ({
      id: p.user?.id ?? p.userId,
      name: p.user?.name ?? 'Member',
      email: p.user?.email,
      avatarUrl: p.user?.avatar ?? undefined,
      role: p.role === 'HOST' ? 'Host' : p.role === 'OBSERVER' ? 'Observer' : undefined,
      status: p.status,
    }),
  );

  const story: PokerVotingStory = activeStory
    ? {
        code: activeStory.code,
        title: activeStory.title,
        description: activeStory.description ?? undefined,
        source: 'Sprint Backlog',
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

  const handleSubmitVote = async (estimate: string) => {
    if (!storyId) return;
    try {
      await submitVoteMutation.mutateAsync({ value: estimate });
      await confirmVoteMutation.mutateAsync();
      toast.success(`Vote submitted: ${estimate}`);
      queryClient.invalidateQueries({ queryKey: ['poker-sessions', sessionId] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Vote failed');
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

  const isHost =
    !!session && (session.host?.id === session.creator?.id || true /* TODO: compare to current user */);

  return (
    <div className='relative h-screen w-full'>
      <VotingRoom
        sessionName={session?.name ?? 'Planning Session'}
        host={host}
        story={story}
        deckType={session?.deckType ?? 'FIBONACCI'}
        participants={participants}
        onInvite={handleInvite}
        onExit={handleExit}
        onSubmitVote={handleSubmitVote}
      />
      {storyId ? (
        <div className='pointer-events-auto fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-background/95 px-3 py-2 shadow-lg backdrop-blur'>
          <Button
            size='sm'
            variant='outline'
            onClick={handleReveal}
            disabled={!isHost || revealMutation.isPending}
          >
            <Eye className='mr-1 size-4' />
            Reveal
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={handleNextStory}
            disabled={!isHost || startMutation.isPending}
          >
            <SkipForward className='mr-1 size-4' />
            Next story
          </Button>
          {activeStory?.status === 'ESTIMATED' && activeStory?.finalPoints != null ? (
            <span className='ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700'>
              <CheckCircle2 className='size-3.5' />
              Avg {activeStory.finalPoints}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
