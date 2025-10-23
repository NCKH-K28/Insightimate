'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2Icon, PanelRightIcon } from 'lucide-react';
import React from 'react';
import { AddSourceButton } from '../buttons/add-source';
import { SourceRef } from '../../types';
import { Checkbox } from '@/components/ui/checkbox';

const sources: SourceRef[] = [
  {
    id: 'source-1',
    srcType: 'file',
    srcId: 'file-123',
    status: 'ready',
    src: { name: 'Document 1', avatar: '📄' },
  },
  {
    id: 'source-2',
    srcType: 'project',
    srcId: 'project-456',
    status: 'processing',
    src: { name: 'Project Alpha', avatar: '📁' },
  },
];
const SourcesList = () => {
  return (
    <div className='flex flex-col'>
      <div
        className={cn('flex items-center justify-between', 'mb-2', 'px-2', 'text-sm font-medium')}
      >
        <Checkbox />
        <span>Selected to analyze</span>
      </div>

      <ul className={cn('space-y-2')}>
        {sources.map((source) => (
          <li
            key={source.id}
            className={cn(
              'flex items-center gap-2',
              'p-2',
              'border rounded',
              'hover:bg-gray-100',
              'dark:hover:bg-gray-800',
            )}
          >
            <Checkbox checked={source.selected} />
            <div className={cn('flex items-center gap-2')}>
              <span className={cn('text-xl')}>{source.src?.avatar}</span>
              <span className={cn('font-medium')}>{source.src?.name}</span>
            </div>
            <span className={cn('text-sm')}>
              {source.status === 'processing' ? (
                <Loader2Icon className={cn('animate-spin')} size={14} />
              ) : source.status === 'ready' ? (
                '✅ Ready'
              ) : (
                '❌ Error'
              )}
            </span>
            <div className={cn('ml-auto')}>
              <Button variant='ghost' size='icon'>
                <PanelRightIcon size={16} />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const SourcesPanel = () => {
  return (
    <div className={cn('flex h-full w-80 flex-col', 'border')}>
      <div
        className={cn('flex items-center gap-2', 'border-b', 'px-4 py-3', 'dark:border-gray-700')}
      >
        <PanelRightIcon size={16} />
        <h2 className={cn('text-sm font-medium')}>Sources</h2>
      </div>
      <div className={cn('flex-1 p-4')}>
        <AddSourceButton />

        <div className={cn('mt-4')}>
          <SourcesList />
        </div>
      </div>
    </div>
  );
};
