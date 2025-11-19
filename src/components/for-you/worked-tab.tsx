'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchWorkedItemsQueryOptions } from '@/features/foryou/api/actions';
import TodayRow from './today-row';
import EmptyState from './empty-state';
import { resolveIcon } from './icon-map';

export default function WorkedTab({ workspaceId }: { workspaceId?: string }) {
  const query = useQuery(fetchWorkedItemsQueryOptions(workspaceId));
  const items = query.data ?? [];

  return (
    <div>
      <h3 className='text-xs font-semibold text-muted-foreground tracking-wide'>WORKED ON</h3>
      <div className='mt-2 space-y-2'>
        {items.length === 0 && !query.isLoading ? (
          <EmptyState label='No recent activity' />
        ) : (
          items.map((item: any) => (
            <TodayRow
              key={item.id}
              title={item.title}
              meta={item.meta}
              Icon={resolveIcon(item.iconName)}
              action={item.action}
              actor={item.actor}
            />
          ))
        )}
      </div>
    </div>
  );
}
