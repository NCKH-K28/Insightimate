'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchWorkedItemsQueryOptions } from '@/features/foryou/api/actions';
import ActivityRow from './activity-row';
import EmptyState from './empty-state';
import { resolveIcon } from './icon-map';

export default function WorkedTab({ workspaceId }: { workspaceId?: string }) {
  const query = useQuery(fetchWorkedItemsQueryOptions(workspaceId));
  const items = query.data ?? [];
  const router = useRouter();

  return (
    <div>
      <h3 className='text-xs font-semibold text-muted-foreground tracking-wide'>WORKED ON</h3>
      <div className='mt-2 space-y-2'>
        {items.length === 0 && !query.isLoading ? (
          <EmptyState label='No recent activity' />
        ) : (
          items.map((item: any) => (
            <ActivityRow
              key={item.id}
              title={item.title}
              meta={item.meta}
              Icon={resolveIcon(item.iconName)}
              action={item.action}
              actor={item.actor}
              onClick={() => {
                if (!workspaceId || !item.projectId) return;
                router.push(`/wps/${workspaceId}/projects/${item.projectId}/issues/${item.id}`);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
