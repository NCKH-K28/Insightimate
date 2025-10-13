'use client';

import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';
import TeamHeader from '@/components/headers/team-header';
import { TeamInfo } from '@/features/teams/ui/components/team-info';
import TeamLinks from '@/features/teams/ui/components/team-links';
import { TeamShare } from '@/features/teams/ui/components/team-share';

export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  if (!teamId) throw new Error('teamId is required');

  return (
    <div className={'flex flex-col gap-6 overflow-y-auto h-full'}>
      <TeamHeader params={{ workspaceId: '', teamId }} />
      <div
        className={cn(
          // 'size-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8',
          // 'p-4 md:p-6 lg:p-8',
          'flex flex-col gap-6',
        )}
      >
        <TeamInfo teamId={teamId} />
        <TeamLinks teamId={teamId} />
        <TeamShare teamId={teamId} />
      </div>
    </div>
  );
}
