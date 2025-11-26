'use client';

import { TeamsHeader } from '@/features/teams/ui/components/teams-header';
import { TeamsList } from '@/features/teams/ui/components/teams-list';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';

export default function TeamsPage() {
  const params = useParams<{ workspaceId: string }>();
  if (!params) throw new Error('TeamsPage must be used within a route with workspaceId param');

  return (
    <Suspense
      fallback={
        <div className='p-6 space-y-4'>
          <div className='h-8 w-1/3 bg-gray-200 rounded animate-pulse' />
          <div className='h-52 bg-gray-200 rounded animate-pulse' />
        </div>
      }
    >
      <TeamsHeader params={{ workspaceId: params.workspaceId }} />
      <TeamsList params={{ workspaceId: params.workspaceId }} />
    </Suspense>
  );
}
