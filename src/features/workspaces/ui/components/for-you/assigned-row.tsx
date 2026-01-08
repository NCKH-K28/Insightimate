'use client';

import React from 'react';

export function AssignedRow({
  title,
  meta,
  Icon,
  status,
  onClick,
}: {
  title: string;
  meta: string;
  checked?: boolean;
  Icon: React.ComponentType<{ className?: string }>;
  status?: { id?: string; name?: string; category?: string } | null;
  onClick?: () => void;
}) {
  return (
    <div
      role='button'
      className='flex items-center gap-3 rounded-xl border p-3 hover:bg-accent/30 cursor-pointer'
      onClick={onClick}
    >
      <Icon className='mt-0.5 h-5 w-5 text-muted-foreground' />
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2'>
          <p className='font-medium leading-none truncate'>{title}</p>
        </div>
        <p className='text-xs text-muted-foreground mt-1 truncate'>{meta}</p>
      </div>

      <div className='ml-auto flex items-center gap-2'>
        {status ? (
          <div className='rounded px-2 py-1 text-xs font-medium bg-muted/20'>{status.name}</div>
        ) : null}
      </div>
    </div>
  );
}

export default AssignedRow;
