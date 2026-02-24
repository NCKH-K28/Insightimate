'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Loader2Icon,
  PanelRightIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ClockIcon,
  FolderIcon,
  FileIcon,
  XCircleIcon,
  BarChart3Icon,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { AddSourceButton } from '../buttons/add-source';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery } from '@tanstack/react-query';
import { SourceActions } from './source-actions';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { listAgentSourcesQueryOptions } from '@/features/agents/api/actions';
import { DataSource } from '@/contracts/agents/agent';

type SourceRef = DataSource;
type SourcesListProps = {
  params: { agentId: string; workspaceId: string };
  selectedSources: string[];
  onSourceToggle: (sourceId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
};

const StatusIcon = ({ status }: { status: SourceRef['status'] }) => {
  const iconProps = { size: 16 };

  switch (status) {
    case 'READY':
      return <CheckCircle2Icon {...iconProps} className='text-green-500' />;
    case 'PROCESSING':
      return <Loader2Icon {...iconProps} className='text-blue-500 animate-spin' />;
    case 'PENDING':
      return <ClockIcon {...iconProps} className='text-yellow-500' />;
    case 'FAILED':
      return <XCircleIcon {...iconProps} className='text-red-500' />;
    default:
      return <ClockIcon {...iconProps} className='text-gray-400' />;
  }
};

const StatusBadge = ({ status }: { status: SourceRef['status'] }) => {
  const variants = {
    READY: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  };

  return (
    <Badge variant='secondary' className={cn('text-xs px-2 py-0.5', variants[status])}>
      {status.toLowerCase()}
    </Badge>
  );
};

const SourceTypeIcon = ({ type }: { type: 'PROJECT' | 'FILE' }) => {
  return type === 'PROJECT' ? (
    <FolderIcon size={16} className='text-blue-600 dark:text-blue-400' />
  ) : (
    <FileIcon size={16} className='text-gray-600 dark:text-gray-400' />
  );
};

const SourcesList = ({
  params,
  selectedSources,
  onSourceToggle,
  onSelectAll,
  onDeselectAll,
}: SourcesListProps) => {
  const {
    data: sources,
    isPending,
    error,
  } = useQuery(listAgentSourcesQueryOptions({ agentId: params.agentId }));

  const allSelected = useMemo(() => {
    if (!sources) return false;
    return sources.length > 0 && selectedSources.length === sources.length;
  }, [selectedSources, sources]);
  const someSelected =
    selectedSources.length > 0 && selectedSources.length < (sources?.length || 0);

  if (isPending) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Loader2Icon size={16} className='animate-spin' />
          Loading sources...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='flex items-center gap-2 text-sm text-red-500'>
          <AlertCircleIcon size={16} />
          Failed to load sources
        </div>
      </div>
    );
  }

  if (!sources || sources.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-8 text-center'>
        <div className='rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-3'>
          <FolderIcon size={24} className='text-gray-400' />
        </div>
        <p className='text-sm text-muted-foreground mb-1'>No sources added yet</p>
        <p className='text-xs text-muted-foreground'>Add sources to start analyzing</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col'>
      {/* Select All Header */}
      <div
        className={cn(
          'flex items-center justify-between',
          'mb-3 pb-2 border-b border-gray-200 dark:border-gray-700',
          'text-sm',
        )}
      >
        <div className='flex items-center gap-2'>
          <Checkbox
            checked={allSelected}
            ref={(el) => {
              if (el && 'indeterminate' in el) el.indeterminate = someSelected;
            }}
            onCheckedChange={(checked) => {
              if (checked) {
                onSelectAll();
              } else {
                onDeselectAll();
              }
            }}
          />
          <span className='font-medium text-gray-700 dark:text-gray-300'>
            {selectedSources.length > 0 ? `${selectedSources.length} selected` : 'Select sources'}
          </span>
        </div>
        {selectedSources.length > 0 && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onDeselectAll}
            className='h-auto p-1 text-xs text-muted-foreground hover:text-foreground'
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Sources List */}
      <ul className='space-y-2'>
        {sources.map((source) => {
          const isSelected = selectedSources.includes(source.id);

          return (
            <li
              key={source.id}
              className={cn(
                'group relative flex items-center gap-3',
                'p-3 border rounded-lg transition-all duration-200',
                'hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600',
                isSelected && 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800',
                source.status === 'FAILED' && 'border-red-200 dark:border-red-800',
                'cursor-pointer',
              )}
              onClick={() => onSourceToggle(source.id)}
            >
              {/* Checkbox */}
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSourceToggle(source.id)}
                className='flex-shrink-0'
              />

              {/* Source Icon */}
              <div className='flex-shrink-0'>
                {source.snapshot?.iconURL ? (
                  <img
                    src={source.snapshot.iconURL}
                    alt={source.snapshot.label}
                    className='h-8 w-8 rounded object-cover border border-gray-200 dark:border-gray-700'
                  />
                ) : (
                  <div className='h-8 w-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center'>
                    <SourceTypeIcon type={source.sourceType} />
                  </div>
                )}
              </div>

              {/* Source Info */}
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 mb-1'>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className='text-sm font-medium truncate'>
                          {source.snapshot?.label || 'Unknown Source'}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{source.snapshot?.label || 'Unknown Source'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <StatusIcon status={source.status} />
                </div>

                <div className='flex items-center gap-2'>
                  <span className='text-xs text-muted-foreground capitalize'>
                    {source.sourceType.toLowerCase()}
                  </span>
                  <StatusBadge status={source.status} />
                </div>
              </div>

              {/* Actions */}
              <div className='flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity'>
                <SourceActions id={source.id} agentId={params.agentId} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

type SourcesPanelProps = { params: { agentId: string; workspaceId: string } };

export const SourcesPanel = ({ params }: SourcesPanelProps) => {
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSourceToggle = (sourceId: string) => {
    setSelectedSources((prev) =>
      prev.includes(sourceId) ? prev.filter((id) => id !== sourceId) : [...prev, sourceId],
    );
  };

  const handleSelectAll = () => {
    // This would need to be implemented with access to all source IDs
    // For now, we'll leave it as a placeholder
  };

  const handleDeselectAll = () => {
    setSelectedSources([]);
  };

  return (
    <div
      className={cn(
        'flex h-full w-80 flex-col',
        'border border-gray-200 dark:border-gray-700',
        'bg-white dark:bg-gray-900',
        isCollapsed ? 'w-12' : 'w-80',
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-3',
          'px-4 py-3',
          'border-b border-gray-200 dark:border-gray-700',
          'bg-gray-50 dark:bg-gray-800/50',
          isCollapsed && 'px-2',
        )}
      >
        {!isCollapsed && (
          <>
            <div className='rounded-md bg-blue-100 dark:bg-blue-900/20 p-1.5'>
              <BarChart3Icon size={16} className='text-blue-600 dark:text-blue-400' />
            </div>
            <h2 className='text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1'>
              Knowledge Sources
            </h2>
          </>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setIsCollapsed(!isCollapsed)}
                className='h-8 w-8'
              >
                <PanelRightIcon
                  size={16}
                  className={cn('transition-transform duration-200', isCollapsed && 'rotate-180')}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isCollapsed ? 'Expand panel' : 'Collapse panel'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className='flex-1 flex flex-col p-4 overflow-hidden'>
          {/* Add Source Button */}
          <div className='mb-4'>
            <AddSourceButton params={params} />
          </div>

          {/* Sources List - Scrollable */}
          <div className='flex-1 overflow-y-auto'>
            <SourcesList
              params={params}
              selectedSources={selectedSources}
              onSourceToggle={handleSourceToggle}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
            />
          </div>
        </div>
      )}
    </div>
  );
};
