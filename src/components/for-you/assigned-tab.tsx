'use client';

import React from 'react';
import EmptyState from './empty-state';

export default function AssignedTab({ workspaceId }: { workspaceId?: string }) {
  // TODO: implement assigned items API and query
  return (
    <div>
      <h3 className='text-xs font-semibold text-muted-foreground tracking-wide'>ASSIGNED TO ME</h3>
      <div className='mt-2'>
        <EmptyState label='Assigned tab not implemented yet' />
      </div>
    </div>
  );
}
