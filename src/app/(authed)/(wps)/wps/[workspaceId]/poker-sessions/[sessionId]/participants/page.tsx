'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { ParticipantsPage } from '@/features/planingpoke';
import type {
  ParticipantRow,
  InviteCandidate,
} from '@/features/planingpoke/ui/forms/participants-page';
import {
  getPokerSessionQueryOptions,
  invitePokerParticipantMutationOptions,
  listPokerParticipantsQueryOptions,
  removePokerParticipantMutationOptions,
  searchPokerInviteCandidatesQueryOptions,
  updatePokerParticipantRoleMutationOptions,
} from '@/features/planingpoke/api/actions';
import { getMeQueryOptions } from '@/features/authn/api/actions';
import type { PokerHostCandidate } from '@/features/planingpoke';

export default function PokerSessionParticipantsPage() {
  const params = useParams<{ workspaceId: string; sessionId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const workspaceId = params?.workspaceId ?? '';
  const sessionId = params?.sessionId ?? '';

  const meQuery = useQuery(getMeQueryOptions());
  const sessionQuery = useQuery(getPokerSessionQueryOptions({ sessionId }));
  const participantsQuery = useQuery(listPokerParticipantsQueryOptions({ sessionId }));

  const [searchQ, setSearchQ] = React.useState('');
  const candidatesQuery = useQuery(
    searchPokerInviteCandidatesQueryOptions({ workspaceId, q: searchQ }),
  );

  const inviteMutation = useMutation(invitePokerParticipantMutationOptions({ sessionId }));
  const roleMutation = useMutation(updatePokerParticipantRoleMutationOptions({ sessionId }));
  const removeMutation = useMutation(removePokerParticipantMutationOptions({ sessionId }));

  const me: any = meQuery.data;
  const meId: string | undefined = me?.id ?? me?.user?.id;
  const session: any = sessionQuery.data;
  const isHost = !!meId && !!session && meId === session.hostUserId;

  const host: PokerHostCandidate = session?.host
    ? {
        id: session.host.id,
        name: session.host.name,
        email: session.host.email,
        avatarUrl: session.host.avatar ?? undefined,
      }
    : { id: 'host', name: 'Host', email: '' };

  const participants: ParticipantRow[] = (participantsQuery.data ?? []).map((p: any) => ({
    participantId: p.id,
    userId: p.user?.id ?? p.userId,
    name: p.user?.name ?? 'Member',
    email: p.user?.email,
    avatarUrl: p.user?.avatar ?? undefined,
    role: p.role,
    status: p.status,
    invitedAt: p.invitedAt ?? null,
    acceptedAt: p.acceptedAt ?? p.joinedAt ?? null,
  }));

  const candidates: InviteCandidate[] = (candidatesQuery.data ?? []).map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatar ?? undefined,
  }));

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/wps/${workspaceId}/poker-sessions/${sessionId}/voting`
      : '';

  const handleInviteCandidate = async (
    c: InviteCandidate,
    role: 'VOTER' | 'OBSERVER' | 'HOST',
  ) => {
    try {
      await inviteMutation.mutateAsync({ userId: c.id, role });
      toast.success(`Invited ${c.name}`);
      setSearchQ('');
      queryClient.invalidateQueries({ queryKey: ['poker-sessions', sessionId, 'participants'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Invite failed');
    }
  };

  const handleChangeRole = async (
    participantId: string,
    role: 'VOTER' | 'OBSERVER' | 'HOST',
  ) => {
    try {
      await roleMutation.mutateAsync({ participantId, role });
      toast.success('Role updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Update failed');
    }
  };

  const handleRemove = async (participantId: string) => {
    try {
      await removeMutation.mutateAsync(participantId);
      toast.success('Member removed');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Remove failed');
    }
  };

  const handleTabChange = (tab: 'voting' | 'backlog' | 'participants' | string) => {
    if (tab === 'voting') {
      router.push(`/wps/${workspaceId}/poker-sessions/${sessionId}/voting`);
    } else if (tab === 'backlog') {
      router.push(`/wps/${workspaceId}/poker-sessions/${sessionId}/backlog`);
    }
  };

  const handleInvitePill = () => {
    void navigator.clipboard?.writeText(shareUrl).catch(() => {});
    toast.success('Invite link copied to clipboard');
  };

  const handleExit = () => {
    router.push(`/wps/${workspaceId}/poker-sessions/${sessionId}/backlog`);
  };

  return (
    <ParticipantsPage
      sessionName={session?.name ?? 'Planning Session'}
      host={host}
      shareUrl={shareUrl}
      participants={participants}
      candidates={candidates}
      searchQuery={searchQ}
      onSearchQueryChange={setSearchQ}
      isHost={isHost}
      busyInvite={inviteMutation.isPending}
      busyRole={roleMutation.isPending}
      busyRemove={removeMutation.isPending}
      onInviteCandidate={handleInviteCandidate}
      onChangeRole={handleChangeRole}
      onRemoveParticipant={handleRemove}
      onTabChange={handleTabChange}
      onInvite={handleInvitePill}
      onExit={handleExit}
    />
  );
}
