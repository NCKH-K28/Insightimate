import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Plus, MoreHorizontal, Search, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Image from 'next/image';
import {
  deleteBoardIssueMutationOptions,
  listBoardIssuesQueryOptions,
} from '@/features/boards/api/actions';
import { BoardIssueItem } from '@/contracts/boards/board.query';
import { toast } from 'sonner';
import { CreateIssueButton } from '../../buttons/create-issue-btn';

type Epic = BoardIssueItem;

type EpicsPanelProps = {
  params: { workspaceId: string; boardId: string; projectId: string };
  className?: string;
  epics?: Epic[];
  selectedEpicId?: string | null;
  onEpicSelect?: (epic: Epic | null) => void;
  onCreateEpic?: () => void;
  onEditEpic?: (epic: Epic) => void;
  onDeleteEpic?: (epic: Epic) => void;
};

type EpicActionsProps = { epic: Epic };
const EpicActions = ({ epic }: EpicActionsProps) => {
  const deleteEpic = useMutation(
    deleteBoardIssueMutationOptions({ boardId: epic.boardId, issueId: epic.id }),
  );

  const handleDelete = () => {
    if (deleteEpic.isPending) return;
    toast.promise(deleteEpic.mutateAsync({}), {
      loading: 'Deleting epic...',
      success: 'Epic deleted successfully',
      error: 'Failed to delete epic',
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='h-6 w-6 shrink-0 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100'
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        <DropdownMenuItem
          className='text-destructive focus:text-destructive'
          onClick={handleDelete}
          disabled={deleteEpic.isPending}
        >
          <Trash2 className='h-4 w-4 mr-2' />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Epic Card Component
const EpicCard = ({
  params,
  epic,
  isSelected,
  isHovered,
  onSelect,
  onHover,
}: {
  params: { workspaceId: string; projectId: string; boardId: string };
  epic: Epic;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
}) => {
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
      <div className='px-2 py-3 flex flex-col gap-2'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex items-center min-w-0 gap-2'>
            {epic.type.iconURL && (
              <Image
                src={epic.type.iconURL}
                alt={epic.type.name}
                width={16}
                height={16}
                className='w-4 h-4 shrink-0'
              />
            )}
            <Link
              href={`/wps/${params.workspaceId}/projects/${params.projectId}/issues/${epic.id}`}
              className={cn('text-xs font-medium text-muted-foreground')}
            >
              {epic.key}
            </Link>
          </div>

          <EpicActions epic={epic} />
        </div>

        {/* Summary */}
        <p className='text-sm font-medium leading-snug line-clamp-2'>{epic.summary}</p>

        {epic._children && epic._children.total > 0 && (
          <Progress value={Math.round((epic._children.done / epic._children.total) * 100)} />
        )}
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
      <div className='shrink-0 p-3 border-b bg-background/80 backdrop-blur-sm'>
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
                <CreateIssueButton
                  params={params}
                  typeFilterFn={(t) => t.hierarchy === 2}
                  typeFetched={(types, setType) => {
                    const defaultType = types.find((t) => t.hierarchy === 2);
                    if (defaultType) setType(defaultType.id);
                  }}
                  renderBtnLabel={() => (
                    <Badge variant='outline' className='p-1.5 cursor-pointer hover:bg-accent/80'>
                      <Plus className='h-4 w-4' />
                    </Badge>
                  )}
                />
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
        <div className='px-2 py-3 flex flex-col gap-2'>
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
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default EpicsPanel;
