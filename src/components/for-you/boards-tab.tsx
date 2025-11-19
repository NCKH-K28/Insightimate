'use client';

import React from 'react';
import EmptyState from './empty-state';

export default function BoardsTab({ workspaceId }: { workspaceId?: string }) {
  // TODO: implement boards query (recent boards, favorites, etc.)
  return (
    <div>
      <h3 className='text-xs font-semibold text-muted-foreground tracking-wide'>BOARDS</h3>
      <div className='mt-2'>
        <EmptyState label='Boards tab not implemented yet' />
      </div>
    </div>
  );
}
