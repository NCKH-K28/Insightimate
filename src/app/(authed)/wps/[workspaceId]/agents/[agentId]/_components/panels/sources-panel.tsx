'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2Icon, PanelRightIcon } from 'lucide-react';
import React from 'react';
import { AddSourceButton } from '../buttons/add-source';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery } from '@tanstack/react-query';
import { SourceActions } from './source-actions';

type SourceRef = {
  id: string;
  sourceType: string;
  sourceId: string;
  source?: { label: string; iconURL: string };
  status: string;
  selected: boolean;
};

type SourcesListProps = { params: { agentId: string; workspaceId: string } };
const SourcesList = ({ params }: SourcesListProps) => {
  const { data: sources } = useQuery({
    queryKey: ['agent-sources', params.agentId],
    queryFn: async () => {
      const response = await fetch(`/api/v2/ai/agents/${params.agentId}/sources`);
      const data = await response.json();
      return data.data as SourceRef[];
    },
  });

  return (
    <div className='flex flex-col'>
      <div
        className={cn('flex items-center justify-between', 'mb-2', 'px-2', 'text-sm font-medium')}
      >
        <Checkbox />
        <span>Selected to analyze</span>
      </div>

      <ul className={cn('space-y-2')}>
        {sources?.map((source) => (
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
              {source.source?.iconURL ? (
                <img
                  src={source.source.iconURL}
                  alt={source.source.label}
                  className={cn('h-6 w-6 rounded')}
                />
              ) : null}
            </div>
            <div className={cn('flex-1', 'min-w-0', 'flex flex-col')}>
              <p className={cn('text-sm font-medium', 'truncate')}>
                {source.source?.label || 'Unknown'}
              </p>
              <p className={cn('text-xs text-gray-500')}>{source.sourceType}</p>
            </div>
            <div className={cn('ml-auto')}>
              <SourceActions id={source.id} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

type SourcesPanelProps = { params: { agentId: string; workspaceId: string } };
export const SourcesPanel = ({ params }: SourcesPanelProps) => {
  return (
    <div className={cn('flex h-full w-80 flex-col', 'border')}>
      <div
        className={cn('flex items-center gap-2', 'border-b', 'px-4 py-3', 'dark:border-gray-700')}
      >
        <PanelRightIcon size={16} />
        <h2 className={cn('text-sm font-medium')}>Sources</h2>
      </div>
      <div className={cn('flex-1 p-4')}>
        <AddSourceButton params={params} />

        <div className={cn('mt-4')}>
          <SourcesList params={params} />
        </div>
      </div>
    </div>
  );
};
