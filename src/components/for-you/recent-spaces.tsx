'use client';

import React from 'react';
import ProjectCard from '@/components/for-you/project-card';

export default function RecentSpaces({
  spaces,
  workspaceId,
}: {
  spaces: any[];
  workspaceId?: string;
}) {
  if (!spaces || spaces.length === 0) {
    return (
      <div className='mt-3'>
        <div className='text-sm text-muted-foreground'>No recent spaces</div>
      </div>
    );
  }

  return (
    <div className='mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2'>
      {spaces.map((p: any) => (
        <ProjectCard
          key={p.id}
          id={p.id}
          workspaceId={workspaceId}
          avatar={p.avatar}
          name={p.name}
          type={p.type}
          color={p.color}
          openItems={p.openItems}
          doneItems={p.doneItems}
          boards={p.boards}
        />
      ))}
    </div>
  );
}
