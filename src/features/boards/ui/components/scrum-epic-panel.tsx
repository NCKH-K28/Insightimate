import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import {
  Plus,
  MoreHorizontal,
  Search,
  X,
  ExternalLink,
  Edit3,
  Trash2,
  Copy,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Image from 'next/image';
import { CreateIssueButton } from '../buttons/create-issue-btn';
import { listBoardIssuesQueryOptions } from '@/features/boards/api/actions';
import Link from 'next/link';

// Types
type IssueType = {
  id: string;
  name: string;
  hierarchy: number;
  iconURL?: string;
  color?: string;
  category: 'TODO' | 'IN_PROGRESS' | 'DONE';
};

type Epic = {
  id: string;
  key: string;
  summary: string;
  type: IssueType;
  progress?: number;
  issueCount?: number;
  doneCount?: number;
  color?: string;
  startDate?: string;
  dueDate?: string;
};

type EpicsPanelProps = {
  params: {
    workspaceId: string;
    boardId: string;
    projectId: string;
  };
  className?: string;
  epics?: Epic[];
  selectedEpicId?: string | null;
  onEpicSelect?: (epic: Epic | null) => void;
  onCreateEpic?: () => void;
  onEditEpic?: (epic: Epic) => void;
  onDeleteEpic?: (epic: Epic) => void;
};

// Status configuration
const STATUS_CONFIG: Record<Epic['type']['category'], { label: string; className: string }> = {
  TODO: {
    label: 'To Do',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  DONE: {
    label: 'Done',
    className: 'bg-green-50 text-green-600 border-green-200',
  },
};

// Epic Card Component
const EpicCard = ({
  params,
  epic,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onEdit,
  onDelete,
}: {
  params: { workspaceId: string; projectId: string; boardId: string };
  epic: Epic;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) => {
  const statusConfig = STATUS_CONFIG[epic.type.category || 'TODO'];

  return (
    <div
      className={cn(
        'group relative bg-card rounded-lg border transition-all duration-200 cursor-pointer',
        'hover:shadow-md hover:border-border/80',
        isSelected && 'ring-2 ring-primary border-primary shadow-md',
        !isSelected && isHovered && 'shadow-sm',
      )}
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Color indicator */}
      <div
        className='absolute left-0 top-0 bottom-0 w-1 rounded-l-lg'
        style={{ backgroundColor: epic.color || '#6554C0' }}
      />

      <div className='pl-4 pr-3 py-3 space-y-2. 5'>
        {/* Header */}
        <div className='flex items-start justify-between gap-2'>
          <div className='flex items-center gap-2 min-w-0'>
            {epic.type.iconURL ? (
              <Image
                src={epic.type.iconURL}
                alt={epic.type.name}
                width={16}
                height={16}
                className='flex-shrink-0'
              />
            ) : (
              <div
                className='w-4 h-4 rounded-sm flex-shrink-0'
                style={{ backgroundColor: epic.color || '#6554C0' }}
              />
            )}
            <Link
              href={`/wps/${params.workspaceId}/projects/${params.projectId}/issues/${epic.id}`}
              className={cn('text-xs font-medium text-muted-foreground')}
            >
              {epic.key}
            </Link>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className={cn(
                  'h-6 w-6 flex-shrink-0 opacity-0 transition-opacity',
                  'group-hover:opacity-100 focus:opacity-100',
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuItem onClick={onEdit}>
                <Edit3 className='h-4 w-4 mr-2' />
                Edit epic
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ExternalLink className='h-4 w-4 mr-2' />
                Open in new tab
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className='h-4 w-4 mr-2' />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='text-destructive focus:text-destructive'
                onClick={onDelete}
              >
                <Trash2 className='h-4 w-4 mr-2' />
                Delete epic
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Summary */}
        <p className='text-sm font-medium leading-snug line-clamp-2 pr-2'>{epic.summary}</p>

        {/* Status & Issue Count */}
        <div className='flex items-center justify-between gap-2'>
          <Badge variant='outline' className={cn('text-xs font-normal', statusConfig?.className)}>
            {statusConfig?.label}
          </Badge>
          <span className='text-xs text-muted-foreground'>
            {epic.doneCount}/{epic.issueCount} done
          </span>
        </div>

        {/* Progress */}
        <div className='space-y-1'>
          <Progress value={epic.progress} className='h-1. 5' />
          <p className='text-xs text-muted-foreground text-right'>{epic.progress}%</p>
        </div>
      </div>
    </div>
  );
};

// Main Component
export const EpicsPanel = ({
  params,
  className,
  selectedEpicId,
  onEpicSelect,
  onCreateEpic,
  onEditEpic,
  onDeleteEpic,
}: EpicsPanelProps) => {
  const { data: epics } = useQuery({
    ...listBoardIssuesQueryOptions(params.boardId, {
      filter: { issueType: { hierarchy: 2 } },
    }),
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredEpicId, setHoveredEpicId] = useState<string | null>(null);

  // Filter epics
  const filteredEpics = useMemo(() => {
    if (!epics) return [];
    if (!searchQuery.trim()) return epics;

    const query = searchQuery.toLowerCase();
    return epics.filter(
      (epic) =>
        epic.summary.toLowerCase().includes(query) || epic.key.toLowerCase().includes(query),
    );
  }, [epics, searchQuery]);

  // Handlers
  const handleEpicSelect = (epic: Epic) => {
    if (selectedEpicId === epic.id) {
      onEpicSelect?.(null); // Deselect
    } else {
      onEpicSelect?.(epic);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className={cn('h-full flex flex-col bg-muted/30', className)}>
      {/* Header */}
      <div className='flex-shrink-0 p-3 border-b bg-background/80 backdrop-blur-sm'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-2'>
            <h2 className='font-semibold text-sm'>Epics</h2>
            <Badge variant='secondary' className='h-5 px-1.5 text-xs'>
              {epics?.length ?? 0}
            </Badge>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='ghost' size='icon' className='h-7 w-7' onClick={onCreateEpic}>
                  <Plus className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent side='bottom'>Create Epic</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Search */}
        <div className='relative'>
          <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search epics...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='h-8 pl-8 pr-8 text-sm bg-background'
          />
          {searchQuery && (
            <Button
              variant='ghost'
              size='icon'
              className='absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6'
              onClick={handleClearSearch}
            >
              <X className='h-3 w-3' />
            </Button>
          )}
        </div>
      </div>

      {/* Epic List */}
      <ScrollArea className='flex-1 overflow-y-auto'>
        <div className='p-2 space-y-2'>
          {/* All Issues Option */}
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
              'hover:bg-accent',
              !selectedEpicId && 'bg-accent',
            )}
            onClick={() => onEpicSelect?.(null)}
          >
            <div className='w-4 h-4 rounded-sm bg-gradient-to-br from-primary/60 to-primary' />
            <span className='text-sm font-medium'>All Epics</span>
            <ChevronRight
              className={cn(
                'ml-auto h-4 w-4 text-muted-foreground transition-transform',
                !selectedEpicId && 'rotate-90',
              )}
            />
          </div>

          {/* Separator */}
          <div className='h-px bg-border mx-2' />

          {/* Filtered Epics */}
          {filteredEpics.length === 0 ? (
            <div className='py-8 text-center'>
              <p className='text-sm text-muted-foreground'>No epics found</p>
              {searchQuery && (
                <Button
                  variant='link'
                  size='sm'
                  onClick={handleClearSearch}
                  className='mt-1 h-auto p-0'
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            filteredEpics.map((epic) => (
              <EpicCard
                params={params}
                key={epic.id}
                epic={epic}
                isSelected={selectedEpicId === epic.id}
                isHovered={hoveredEpicId === epic.id}
                onSelect={() => handleEpicSelect(epic)}
                onHover={(hovered) => setHoveredEpicId(hovered ? epic.id : null)}
                onEdit={() => onEditEpic?.(epic)}
                onDelete={() => onDeleteEpic?.(epic)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className='flex-shrink-0 p-2 border-t bg-background/80'>
        <CreateIssueButton
          params={params}
          typeFilterFn={(t) => t.hierarchy === 2}
          typeFetched={(types, setType) => {
            const defaultType = types.find((t) => t.hierarchy === 2);
            if (defaultType) setType(defaultType.id);
          }}
        />
      </div>
    </div>
  );
};

export default EpicsPanel;
