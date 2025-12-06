import React from 'react';

export function EmptyState({ label }: { label: string }) {
  return (
    <div className='flex items-center justify-center rounded-xl border bg-muted/30 py-12 text-sm text-muted-foreground'>
      {label}
    </div>
  );
}

export default EmptyState;
