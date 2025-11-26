'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Plus,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  GripVertical,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Link2,
  Trash2,
  ExternalLink,
  ArrowUpRight,
  Loader2,
  ListTree,
  X,
  Search,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  listBoardIssuesQueryOptions,
  createBoardIssueMutationOptions,
  updateBoardIssueMutationOptions,
  deleteBoardIssueMutationOptions,
} from '@/features/boards/api/actions';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ============ Types ============

interface SubIssue {
  id: string;
  key: string;
  summary: string;
  status: {
    id: string;
    name: string;
    category?: 'todo' | 'in_progress' | 'done';
  };
  priority?: {
    id: string;
    name: string;
    color?: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  storyPoints?: number | null;
  dueDate?: Date | string | null;
  createdAt: Date | string;
  order?: number;
}

interface SubIssuesProps {
  params: { workspaceId: string; boardId: string; projectId: string; issueId: string };
  statuses?: Array<{ id: string; name: string; category?: string }>;
  className?: string;
}

type FilterStatus = 'all' | 'open' | 'done';
type SortOption = 'created' | 'priority' | 'status' | 'assignee';

// ============ Helper Functions ============

const getStatusIcon = (category?: string) => {
  switch (category) {
    case 'done':
      return <CheckCircle2 className='h-4 w-4 text-green-500' />;
    case 'in_progress':
      return <Clock className='h-4 w-4 text-blue-500' />;
    default:
      return <Circle className='h-4 w-4 text-muted-foreground' />;
  }
};

const getStatusColor = (category?: string) => {
  switch (category) {
    case 'done':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'in_progress':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }
};

const getPriorityColor = (priority?: string) => {
  switch (priority?.toLowerCase()) {
    case 'highest':
    case 'critical':
      return 'text-red-500';
    case 'high':
      return 'text-orange-500';
    case 'medium':
      return 'text-yellow-500';
    case 'low':
      return 'text-blue-500';
    case 'lowest':
      return 'text-gray-400';
    default:
      return 'text-muted-foreground';
  }
};

const isOverdue = (dueDate?: Date | string | null) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// ============ Sub Components ============

// Loading Skeleton
const SubIssuesSkeleton = () => (
  <div className='space-y-3'>
    <div className='flex items-center justify-between'>
      <Skeleton className='h-5 w-32' />
      <Skeleton className='h-8 w-24' />
    </div>
    <Skeleton className='h-2 w-full rounded-full' />
    <div className='space-y-2'>
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className='h-14 w-full rounded-lg' />
      ))}
    </div>
  </div>
);

// Empty State
interface EmptyStateProps {
  onAdd: () => void;
  isCreating: boolean;
}

const EmptyState = ({ onAdd, isCreating }: EmptyStateProps) => (
  <div className='flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed border-border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors'>
    <div className='rounded-full bg-muted p-3 mb-3'>
      <ListTree className='h-6 w-6 text-muted-foreground' />
    </div>
    <h4 className='text-sm font-medium text-foreground mb-1'>No sub-issues yet</h4>
    <p className='text-xs text-muted-foreground text-center mb-4 max-w-xs'>
      Break down this issue into smaller, manageable tasks
    </p>
    <Button size='sm' onClick={onAdd} disabled={isCreating} className='gap-1.5'>
      {isCreating ? (
        <Loader2 className='h-3.5 w-3.5 animate-spin' />
      ) : (
        <Plus className='h-3.5 w-3.5' />
      )}
      Add sub-issue
    </Button>
  </div>
);

// Progress Header
interface ProgressHeaderProps {
  total: number;
  completed: number;
  isCollapsed: boolean;
  onToggle: () => void;
}

const ProgressHeader = ({ total, completed, isCollapsed, onToggle }: ProgressHeaderProps) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <button
          onClick={onToggle}
          className='flex items-center gap-2 hover:bg-accent/50 rounded-md px-2 py-1 -ml-2 transition-colors'
        >
          {isCollapsed ? (
            <ChevronRight className='h-4 w-4 text-muted-foreground' />
          ) : (
            <ChevronDown className='h-4 w-4 text-muted-foreground' />
          )}
          <span className='text-sm font-medium text-foreground'>Sub-issues</span>
          <Badge variant='secondary' className='text-xs font-normal'>
            {completed}/{total}
          </Badge>
        </button>

        <span className='text-xs text-muted-foreground'>{percentage}% done</span>
      </div>

      <Progress value={percentage} className='h-1.5' />
    </div>
  );
};

// Quick Add Input
interface QuickAddInputProps {
  onSubmit: (summary: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const QuickAddInput = ({ onSubmit, onCancel, isLoading }: QuickAddInputProps) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className='flex items-center gap-2 p-2 bg-muted/50 rounded-lg'>
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='What needs to be done?'
        className='flex-1 h-9 text-sm'
        disabled={isLoading}
      />
      <Button type='submit' size='sm' disabled={!value.trim() || isLoading} className='h-9'>
        {isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Add'}
      </Button>
      <Button type='button' variant='ghost' size='sm' onClick={onCancel} className='h-9 px-2'>
        <X className='h-4 w-4' />
      </Button>
    </form>
  );
};

// Sortable Sub Issue Item
interface SubIssueItemProps {
  issue: SubIssue;
  workspaceId: string;
  projectId: string;
  onStatusChange: (issueId: string, statusId: string) => void;
  onDelete: (issueId: string) => void;
  statuses?: Array<{ id: string; name: string; category?: string }>;
  isDragging?: boolean;
}

const SubIssueItem = ({
  issue,
  workspaceId,
  projectId,
  onStatusChange,
  onDelete,
  statuses,
  isDragging,
}: SubIssueItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting,
  } = useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const overdue = isOverdue(issue.dueDate) && issue.status.category !== 'done';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 p-3 bg-card border border-border rounded-lg',
        'hover:border-primary/30 hover:shadow-sm transition-all duration-200',
        isSorting && 'opacity-50 shadow-lg',
        isDragging && 'cursor-grabbing',
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className='opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-accent rounded transition-opacity'
        aria-label='Drag to reorder'
      >
        <GripVertical className='h-4 w-4 text-muted-foreground' />
      </button>

      {/* Status Icon/Checkbox */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                const doneStatus = statuses?.find((s) => s.category === 'done');
                const todoStatus = statuses?.find((s) => s.category === 'todo');
                if (issue.status.category === 'done' && todoStatus) {
                  onStatusChange(issue.id, todoStatus.id);
                } else if (doneStatus) {
                  onStatusChange(issue.id, doneStatus.id);
                }
              }}
              className='shrink-0 hover:scale-110 transition-transform'
            >
              {getStatusIcon(issue.status.category)}
            </button>
          </TooltipTrigger>
          <TooltipContent side='top'>
            <p>{issue.status.category === 'done' ? 'Mark as incomplete' : 'Mark as complete'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Issue Key */}
      <Link href={`/${workspaceId}/projects/${projectId}/issues/${issue.id}`} className='shrink-0'>
        <Badge
          variant='outline'
          className='font-mono text-xs hover:bg-accent transition-colors cursor-pointer'
        >
          {issue.key}
        </Badge>
      </Link>

      {/* Summary */}
      <Link
        href={`/${workspaceId}/projects/${projectId}/issues/${issue.id}`}
        className={cn(
          'flex-1 text-sm truncate hover:text-primary transition-colors',
          issue.status.category === 'done' && 'line-through text-muted-foreground',
        )}
      >
        {issue.summary}
      </Link>

      {/* Due Date Warning */}
      {overdue && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger>
              <AlertCircle className='h-4 w-4 text-red-500 shrink-0' />
            </TooltipTrigger>
            <TooltipContent side='top'>
              <p>Overdue</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Story Points */}
      {issue.storyPoints != null && (
        <Badge variant='secondary' className='text-xs font-mono shrink-0'>
          {issue.storyPoints} SP
        </Badge>
      )}

      {/* Status Badge */}
      <Badge className={cn('text-xs shrink-0', getStatusColor(issue.status.category))}>
        {issue.status.name}
      </Badge>

      {/* Assignee */}
      {issue.assignee ? (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger>
              <Avatar className='h-6 w-6 shrink-0'>
                <AvatarImage src={issue.assignee.avatar} alt={issue.assignee.name} />
                <AvatarFallback className='text-xs'>
                  {getInitials(issue.assignee.name)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side='top'>
              <p>{issue.assignee.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <div className='h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground/30 shrink-0' />
      )}

      {/* Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0'
          >
            <MoreHorizontal className='h-4 w-4' />
            <span className='sr-only'>More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-48'>
          <DropdownMenuItem asChild>
            <Link href={`/${workspaceId}/projects/${projectId}/issues/${issue.id}`}>
              <ExternalLink className='h-4 w-4 mr-2' />
              Open issue
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link2 className='h-4 w-4 mr-2' />
            Copy link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className='text-destructive focus:text-destructive'
            onClick={() => onDelete(issue.id)}
          >
            <Trash2 className='h-4 w-4 mr-2' />
            Remove sub-issue
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// Filter Bar
interface FilterBarProps {
  filter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  total: number;
  filtered: number;
}

const FilterBar = ({
  filter,
  onFilterChange,
  sort,
  onSortChange,
  searchQuery,
  onSearchChange,
  total,
  filtered,
}: FilterBarProps) => {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className='flex items-center gap-2 py-2'>
      {/* Search */}
      {showSearch ? (
        <div className='flex-1 relative'>
          <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            autoFocus
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder='Search sub-issues...'
            className='h-8 pl-8 pr-8 text-sm'
          />
          {searchQuery && (
            <button
              onClick={() => {
                onSearchChange('');
                setShowSearch(false);
              }}
              className='absolute right-2 top-1/2 -translate-y-1/2'
            >
              <X className='h-4 w-4 text-muted-foreground hover:text-foreground' />
            </button>
          )}
        </div>
      ) : (
        <Button variant='ghost' size='sm' onClick={() => setShowSearch(true)} className='h-8 px-2'>
          <Search className='h-4 w-4' />
        </Button>
      )}

      {/* Filter Tabs */}
      <div className='flex items-center bg-muted rounded-md p-0.5'>
        {(['all', 'open', 'done'] as FilterStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => onFilterChange(status)}
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded transition-colors capitalize',
              filter === status
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Sort */}
      <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
        <SelectTrigger className='h-8 w-[120px] text-xs'>
          <SelectValue placeholder='Sort by' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='created'>Created</SelectItem>
          <SelectItem value='priority'>Priority</SelectItem>
          <SelectItem value='status'>Status</SelectItem>
          <SelectItem value='assignee'>Assignee</SelectItem>
        </SelectContent>
      </Select>

      {/* Count */}
      {filtered !== total && (
        <span className='text-xs text-muted-foreground'>
          Showing {filtered} of {total}
        </span>
      )}
    </div>
  );
};

// ============ Main Component ============

export default function SubIssues({ params, statuses = [], className }: SubIssuesProps) {
  // State
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [sort, setSort] = useState<SortOption>('created');
  const [searchQuery, setSearchQuery] = useState('');

  // Query
  const {
    data: subIssues,
    isLoading,
    isError,
    error,
  } = useQuery({
    ...listBoardIssuesQueryOptions(params.boardId, { filter: { parentId: params.issueId } }),
    initialData: { data: [], meta: { total: 0 } },
  });

  // Mutations
  const createMutation = useMutation(createBoardIssueMutationOptions(params.boardId));
  const updateMutation = useMutation(updateBoardIssueMutationOptions(params));
  const deleteMutation = useMutation(deleteBoardIssueMutationOptions(params));

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Handlers
  const handleStatusChange = useCallback(
    (issueId: string, statusId: string) => {
      updateMutation.mutate({ issueId, statusId });
    },
    [updateMutation],
  );

  const handleDelete = useCallback(
    (issueId: string) => {
      deleteMutation.mutate(issueId);
    },
    [deleteMutation],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = subIssues.findIndex((item) => item.id === active.id);
        const newIndex = subIssues.findIndex((item) => item.id === over.id);

        const newOrder = arrayMove(subIssues, oldIndex, newIndex);

        // Update order in backend
        newOrder.forEach((issue, index) => {
          if (issue.order !== index) {
            updateMutation.mutate({
              issueId: issue.id,
              data: { order: index } as any,
            });
          }
        });
      }
    },
    [subIssues, updateMutation],
  );

  // Filtered & Sorted Issues
  const filteredIssues = useMemo(() => {
    let result = [...subIssues];

    // Apply filter
    if (filter === 'open') {
      result = result.filter((issue) => issue.status.category !== 'done');
    } else if (filter === 'done') {
      result = result.filter((issue) => issue.status.category === 'done');
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (issue) =>
          issue.summary.toLowerCase().includes(query) || issue.key.toLowerCase().includes(query),
      );
    }

    // Apply sort
    result.sort((a, b) => {
      switch (sort) {
        case 'priority':
          return (a.priority?.name ?? '').localeCompare(b.priority?.name ?? '');
        case 'status':
          return a.status.name.localeCompare(b.status.name);
        case 'assignee':
          return (a.assignee?.name ?? '').localeCompare(b.assignee?.name ?? '');
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [subIssues, filter, searchQuery, sort]);

  // Stats
  const completedCount = subIssues.filter((i) => i.status.category === 'done').length;
  const totalCount = subIssues.length;

  // Loading State
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <SubIssuesSkeleton />
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div
        className={cn('p-4 border border-destructive/50 rounded-lg bg-destructive/10', className)}
      >
        <div className='flex items-center gap-2 text-destructive'>
          <AlertCircle className='h-4 w-4' />
          <span className='text-sm font-medium'>Failed to load sub-issues</span>
        </div>
        <p className='text-xs text-muted-foreground mt-1'>
          {(error as Error)?.message ?? 'An unknown error occurred'}
        </p>
      </div>
    );
  }

  // Empty State
  if (totalCount === 0 && !isAdding) {
    return (
      <div className={className}>
        <EmptyState onAdd={() => setIsAdding(true)} isCreating={createMutation.isPending} />
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Progress Header */}
      <ProgressHeader
        total={totalCount}
        completed={completedCount}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Content */}
      {!isCollapsed && (
        <div className='space-y-3 animate-in slide-in-from-top-2 duration-200'>
          {/* Filter Bar (only show if there are issues) */}
          {totalCount > 0 && (
            <FilterBar
              filter={filter}
              onFilterChange={setFilter}
              sort={sort}
              onSortChange={setSort}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              total={totalCount}
              filtered={filteredIssues.length}
            />
          )}

          {/* Quick Add */}
          {isAdding ? (
            <QuickAddInput
              onSubmit={(summary) => createMutation.mutate(summary)}
              onCancel={() => setIsAdding(false)}
              isLoading={createMutation.isPending}
            />
          ) : (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setIsAdding(true)}
              className='w-full justify-start gap-2 text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-primary/30'
            >
              <Plus className='h-4 w-4' />
              Add sub-issue
            </Button>
          )}

          {/* Issues List with DnD */}
          {filteredIssues.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredIssues.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className='space-y-2'>
                  {filteredIssues.map((issue) => (
                    <SubIssueItem
                      key={issue.id}
                      issue={issue}
                      workspaceId={params.workspaceId}
                      projectId={params.projectId}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      statuses={statuses}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            searchQuery && (
              <div className='text-center py-6 text-muted-foreground'>
                <Search className='h-8 w-8 mx-auto mb-2 opacity-50' />
                <p className='text-sm'>No sub-issues match "{searchQuery}"</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

SubIssues.displayName = 'SubIssues';
