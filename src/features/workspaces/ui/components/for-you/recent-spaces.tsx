'use client';

import React from 'react';
import ProjectCard from './project-card';

export default function RecentSpaces({
  spaces = [],
  workspaceId,
  viewedItems,
}: {
  spaces?: any[];
  workspaceId?: string;
  viewedItems?: any[];
}) {
  const derivedFromViewed = (viewedItems ?? [])
    .filter((it: any) => it.type === 'PROJECT')
    .map((p: any) => {
      const id = p.id;
      const name = p.title ?? 'Project';
      const avatar = p.avatar ?? null;
      const type = p.projectType ?? 'PROJECT';
      const openItems = p.totalIssues ?? p.openItems ?? 0;
      const doneItems = p.doneIssues ?? p.doneItems ?? 0;
      const colors = [
        'bg-sky-400',
        'bg-violet-500',
        'bg-emerald-400',
        'bg-amber-400',
        'bg-indigo-400',
      ];
      const color = p.color ?? colors[Math.abs(hashCode(id)) % colors.length];
      return { id, name, type, avatar, color, openItems, doneItems };
    });

  const itemsToRender = spaces && spaces.length > 0 ? spaces : derivedFromViewed;

  if (!itemsToRender || itemsToRender.length === 0) {
    return (
      <div className='mt-3'>
        <div className='text-sm text-muted-foreground'>No recent spaces</div>
      </div>
    );
  }

  return (
    <div className='mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2'>
      {itemsToRender.map((p: any) => (
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
        />
      ))}
    </div>
  );
}

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}
