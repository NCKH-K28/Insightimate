'use client';

import { VotingRoom } from '@/features/planingpoke';
import {
  MOCK_HOST,
  MOCK_PARTICIPANTS,
  MOCK_VOTING_STORY,
} from '@/features/planingpoke/utils/mock-backlog';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function PokerSessionVotingPage() {
  const params = useParams<{ workspaceId: string; sessionId: string }>();
  const router = useRouter();

  const workspaceId = params?.workspaceId ?? 'demo';
  const sessionId = params?.sessionId ?? 'q3-sprint-planning';

  const handleInvite = () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${sessionId}`;
    void navigator.clipboard?.writeText(url).catch(() => {});
    toast.success('Invite link copied to clipboard');
  };

  const handleExit = () => {
    router.push(`/wps/${workspaceId}/poker-sessions/${sessionId}/backlog`);
  };

  const handleSubmitVote = (estimate: string) => {
    // TODO: gửi lên server qua socket khi backend sẵn sàng.
    console.info('[poker] vote submitted', { sessionId, estimate });
  };

  return (
    <VotingRoom
      sessionName='Q3 Sprint Planning'
      host={MOCK_HOST}
      story={MOCK_VOTING_STORY}
      deckType='FIBONACCI'
      participants={MOCK_PARTICIPANTS}
      onInvite={handleInvite}
      onExit={handleExit}
      onSubmitVote={handleSubmitVote}
    />
  );
}
