'use client';

import { BacklogSelector } from '@/features/planingpoke';
import { MOCK_BACKLOG, MOCK_HOST } from '@/features/planingpoke/utils/mock-backlog';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function PokerSessionBacklogPage() {
  const params = useParams<{ workspaceId: string; sessionId: string }>();
  const router = useRouter();

  const workspaceId = params?.workspaceId ?? 'demo';
  const sessionId = params?.sessionId ?? 'q3-sprint-planning';

  const handleStart = (selectedIds: string[]) => {
    toast.success('Planning Poker started', {
      description: `${selectedIds.length} stories will be estimated.`,
    });
    // TODO: thay route khi voting room sẵn sàng.
    router.push(`/wps/${workspaceId}/poker-sessions/${sessionId}/voting`);
  };

  const handleInvite = () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${sessionId}`;
    void navigator.clipboard?.writeText(url).catch(() => {});
    toast.success('Invite link copied to clipboard');
  };

  const handleExit = () => {
    router.push(`/wps/${workspaceId}/poker-sessions/create`);
  };

  return (
    <BacklogSelector
      sessionName='Q3 Sprint Planning'
      host={MOCK_HOST}
      stories={MOCK_BACKLOG}
      initialSelectedIds={['jira-101', 'jira-205']}
      onStart={handleStart}
      onInvite={handleInvite}
      onExit={handleExit}
    />
  );
}
