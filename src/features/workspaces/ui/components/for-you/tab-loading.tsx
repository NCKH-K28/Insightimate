'use client';

import React from 'react';

export default function TabLoading({ rows = 4 }: { rows?: number }) {
  const items = Array.from({ length: rows }).map((_, i) => i);
  return (
    <div className='space-y-2'>
      {items.map((n) => (
        <div key={n} className='flex items-center gap-3 rounded-xl border p-3'>
          <div className='h-5 w-5 rounded bg-muted/30 animate-pulse' />
          <div className='flex-1 min-w-0'>
            <div className='h-4 bg-muted/30 rounded w-3/5 mb-2 animate-pulse' />
            <div className='h-3 bg-muted/30 rounded w-2/5 animate-pulse' />
          </div>
          <div className='ml-auto'>
            <div className='h-8 w-8 rounded-full bg-muted/30 animate-pulse' />
          </div>
        </div>
      ))}
    </div>
  );
}
