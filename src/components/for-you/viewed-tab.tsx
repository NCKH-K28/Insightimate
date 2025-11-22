'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchViewedItemsQueryOptions } from '@/features/foryou/api/actions';
import EmptyState from './empty-state';
import ActivityRow from './activity-row';
import { resolveIcon } from './icon-map';

export default function ViewedTab({ workspaceId }: { workspaceId?: string }) {
  const query = useQuery(fetchViewedItemsQueryOptions(workspaceId));
  const items = query.data ?? [];
  const router = useRouter();

  return (
    <div>
      <h3 className='text-xs font-semibold text-muted-foreground tracking-wide'>VIEWED</h3>
      <div className='mt-2 space-y-2'>
        {items.length === 0 && !query.isLoading ? (
          <EmptyState label='No recently viewed items' />
        ) : (
          items.map((item: any) => {
            if (item.type === 'ISSUE') {
              return (
                <ActivityRow
                  key={`issue-${item.id}`}
                  title={item.title}
                  meta={item.meta ?? ''}
                  Icon={resolveIcon(item.iconName)}
                  onClick={() => {
                    if (!workspaceId || !item.projectId) return;
                    router.push(`/wps/${workspaceId}/projects/${item.projectId}/issues/${item.id}`);
                  }}
                />
              );
            }

            return (
              <ActivityRow
                key={`proj-${item.id}`}
                title={item.title}
                meta={item.meta ?? ''}
                Icon={resolveIcon(item.avatar)}
                onClick={() => {
                  if (!workspaceId) return;
                  router.push(`/wps/${workspaceId}/projects/${item.id}`);
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
