'use client';

import React from 'react';
import EmptyState from './empty-state';

export default function StarredTab() {
  // TODO: implement starred items API and query
  return (
    <div>
      <h3 className='text-xs font-semibold text-muted-foreground tracking-wide'>STARRED</h3>
      <div className='mt-2'>
        <EmptyState label='Starred tab not implemented yet' />
      </div>
    </div>
  );
}
