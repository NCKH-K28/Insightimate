'use client';

import * as React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { SummaryPage } from '@/features/planingpoke';
import type {
  SummaryStoryRow,
  SummaryParticipantAvatar,
} from '@/features/planingpoke/ui/forms/summary-page';
import {
  completePokerSessionMutationOptions,
  getPokerSessionQueryOptions,
  listPokerParticipantsQueryOptions,
  listPokerStoriesQueryOptions,
} from '@/features/planingpoke/api/actions';
import type { PokerHostCandidate } from '@/features/planingpoke';

export default function PokerSessionSummaryPage() {
  const params = useParams<{ workspaceId: string; sessionId: string }>();
  const router = useRouter();

  const workspaceId = params?.workspaceId ?? '';
  const sessionId = params?.sessionId ?? '';

  const sessionQuery = useQuery(getPokerSessionQueryOptions({ sessionId }));
  const storiesQuery = useQuery(listPokerStoriesQueryOptions({ sessionId }));
  const participantsQuery = useQuery(listPokerParticipantsQueryOptions({ sessionId }));

  const completeMutation = useMutation(completePokerSessionMutationOptions({ sessionId }));

  const session: any = sessionQuery.data;

  const host: PokerHostCandidate = session?.host
    ? {
        id: session.host.id,
        name: session.host.name,
        email: session.host.email,
        avatarUrl: session.host.avatar ?? undefined,
      }
    : { id: 'host', name: 'Host', email: '' };

  const stories: SummaryStoryRow[] = (storiesQuery.data ?? []).map((s: any) => ({
    id: s.id,
    code: s.code ?? null,
    title: s.title,
    epic: s.epic ?? null,
    finalPoints: s.finalPoints ?? null,
    status: s.status,
  }));

  const participants: SummaryParticipantAvatar[] = (participantsQuery.data ?? []).map(
    (p: any) => ({
      id: p.id,
      name: p.user?.name ?? 'Member',
      avatarUrl: p.user?.avatar ?? undefined,
    }),
  );

  const handleBackToDashboard = () => {
    router.push(`/wps/${workspaceId}/poker-sessions`);
  };

  const handleShareReport = () => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/wps/${workspaceId}/poker-sessions/${sessionId}/summary`
        : '';
    void navigator.clipboard?.writeText(url).catch(() => {});
    toast.success('Report link copied to clipboard');
  };

  const handleExportJira = () => {
    toast.info('Jira export is not configured yet.');
  };

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync();
      toast.success('Session completed');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Failed to complete');
    }
  };

  const handleTabChange = (tab: 'voting' | 'backlog' | 'participants' | 'summary' | string) => {
    if (tab === 'voting') {
      router.push(`/wps/${workspaceId}/poker-sessions/${sessionId}/voting`);
    } else if (tab === 'backlog') {
      router.push(`/wps/${workspaceId}/poker-sessions/${sessionId}/backlog`);
    } else if (tab === 'participants') {
      router.push(`/wps/${workspaceId}/poker-sessions/${sessionId}/participants`);
    }
  };

  const handleInvitePill = () => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/wps/${workspaceId}/poker-sessions/${sessionId}/voting`
        : '';
    void navigator.clipboard?.writeText(url).catch(() => {});
    toast.success('Invite link copied to clipboard');
  };

  const handleExit = () => {
    router.push(`/wps/${workspaceId}/poker-sessions`);
  };

  return (
    <SummaryPage
      sessionName={session?.name ?? 'Planning Session'}
      host={host}
      stories={stories}
      participants={participants}
      isComplete={session?.status === 'COMPLETED'}
      busyComplete={completeMutation.isPending}
      onBackToDashboard={handleBackToDashboard}
      onShareReport={handleShareReport}
      onExportJira={handleExportJira}
      onCompleteSession={handleComplete}
      onTabChange={handleTabChange}
      onInvite={handleInvitePill}
      onExit={handleExit}
    />
  );
}
