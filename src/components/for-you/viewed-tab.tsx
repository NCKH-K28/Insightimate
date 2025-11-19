'use client';

import React from 'react';
import EmptyState from './empty-state';

export default function ViewedTab({ workspaceId }: { workspaceId?: string }) {
  // TODO: implement viewed items API and query
  return (
    <div>
      <h3 className='text-xs font-semibold text-muted-foreground tracking-wide'>VIEWED</h3>
      <div className='mt-2'>
        <EmptyState label='Viewed tab not implemented yet' />
      </div>
    </div>
  );
}
