'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAssignedItemsQueryOptions } from '@/features/foryou/api/actions';
import EmptyState from './empty-state';
import AssignedRow from './assigned-row';
import { resolveIcon } from './icon-map';

export default function AssignedTab({ workspaceId }: { workspaceId?: string }) {
  const query = useQuery(fetchAssignedItemsQueryOptions(workspaceId));
  const items = query.data ?? [];

  return (
    <div>
      <h3 className='text-xs font-semibold text-muted-foreground tracking-wide'>ASSIGNED TO ME</h3>
      <div className='mt-2 space-y-2'>
        {items.length === 0 && !query.isLoading ? (
          <EmptyState label='No assigned items' />
        ) : (
          items.map((item: any) => (
            <AssignedRow
              key={item.id}
              title={item.title}
              meta={item.meta}
              Icon={resolveIcon(item.iconName)}
              status={item.status}
            />
          ))
        )}
      </div>
    </div>
  );
}
