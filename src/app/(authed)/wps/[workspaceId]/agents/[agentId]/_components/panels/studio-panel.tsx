'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PanelRightIcon } from 'lucide-react';
import React from 'react';

export const StudioPanel = () => {
  return (
    <div
      className={cn(
        'flex h-full flex-col',
        'transition-width duration-300 ease-in-out',
        'border',
        'w-80',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2',
          'px-4 py-1',
          'border-b',
          //
        )}
      >
        <Button variant='ghost' size='icon'>
          <PanelRightIcon size={16} />
        </Button>
        <span className='sr-only'>Open panel</span>
      </div>

      <div>
        {/* Panel content goes here */}
        {/*  */}
      </div>
    </div>
  );
};
