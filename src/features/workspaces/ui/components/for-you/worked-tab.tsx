'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchWorkedItemsQueryOptions, viewItem } from '@/features/foryou/api/actions';
import ActivityRow from './activity-row';
import EmptyState from './empty-state';
import { resolveIcon } from './icon-map';
import TabLoading from './tab-loading';

export default function WorkedTab({ workspaceId }: { workspaceId?: string }) {
  const query = useQuery(fetchWorkedItemsQueryOptions(workspaceId));
  const items = query.data ?? [];
  const router = useRouter();

  return (
    <div>
      <h3 className='text-xs font-semibold text-muted-foreground tracking-wide'>WORKED ON</h3>
      <div className='mt-2 space-y-2'>
        {query.isLoading ? (
          <TabLoading />
        ) : items.length === 0 ? (
          <EmptyState label='No recent activity' />
        ) : (
          items.map((item: any) => (
            <ActivityRow
              key={item.id}
              title={item.title}
              meta={item.meta}
              Icon={resolveIcon(item.icon)}
              action={item.action}
              actors={item.actors}
              onClick={async () => {
                if (!workspaceId || !item.projectId) return;
                await viewItem(workspaceId, { type: 'ISSUE', entityId: item.id, context: { projectId: item.projectId } });
                router.push(`/wps/${workspaceId}/projects/${item.projectId}/issues/${item.id}`);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
