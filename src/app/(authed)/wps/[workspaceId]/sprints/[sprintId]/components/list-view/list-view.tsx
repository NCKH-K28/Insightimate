'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Search,
  Play,
  User as UserIcon,
  X,
  GripVertical,
  Eye,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Inbox,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  StatusBadge,
  UserAvatar,
  IssueTypeIcon,
  PriorityIcon,
  StoryPointsBadge,
} from '../board-view/helper-components';
import { BoardIssueItem } from '@/contracts/boards/boards.query';
import { useQuery } from '@tanstack/react-query';

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <div className='flex flex-col items-center justify-center h-64 text-center p-6'>
      <div className='h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4'>
        <Icon className='h-8 w-8 text-slate-400' />
      </div>
      <h3 className='text-lg font-semibold text-slate-900 mb-1'>{title}</h3>
      <p className='text-sm text-muted-foreground max-w-sm mb-4'>{description}</p>
      {action && (
        <Button onClick={action.onClick}>
          <Plus className='h-4 w-4 mr-2' />
          {action.label}
        </Button>
      )}
    </div>
  );
}

function NoSearchResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className='flex flex-col items-center justify-center h-64 text-center p-6'>
      <div className='h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4'>
        <Search className='h-8 w-8 text-slate-400' />
      </div>
      <h3 className='text-lg font-semibold text-slate-900 mb-1'>No results found</h3>
      <p className='text-sm text-muted-foreground max-w-sm mb-4'>
        No issues match &quot;<span className='font-medium'>{query}</span>&quot;. Try adjusting your
        search or filters.
      </p>
      <Button variant='outline' onClick={onClear}>
        <X className='h-4 w-4 mr-2' />
        Clear search
      </Button>
    </div>
  );
}

// ============================================================================
// Issue Quick Actions
// ============================================================================

function IssueQuickActions({
  issue,
  onAssign,
  onDelete,
}: {
  issue: BoardIssueItem;
  onAssign?: (user: any | null) => void;
  onDelete?: () => void;
}) {
  const handleCopyKey = () => {
    navigator.clipboard.writeText(issue.key);
    toast.success(`${issue.key} copied to clipboard`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/issues/${issue.key}`);
    toast.success('Issue link copied to clipboard');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='h-6 w-6 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity'
        >
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCopyKey}>
          <Copy className='h-4 w-4 mr-2' />
          Copy issue key
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          <ExternalLink className='h-4 w-4 mr-2' />
          Copy link
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Play className='h-4 w-4 mr-2' />
            Change status
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent></DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <UserIcon className='h-4 w-4 mr-2' />
            Assign to
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => onAssign?.(null)}>
              <UserIcon className='h-4 w-4 mr-2 text-slate-400' />
              Unassigned
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <Eye className='h-4 w-4 mr-2' />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Edit className='h-4 w-4 mr-2' />
          Edit issue
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem className='text-destructive focus:text-destructive' onClick={onDelete}>
          <Trash2 className='h-4 w-4 mr-2' />
          Remove from sprint
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// List View Component
// ============================================================================

export function ListView({
  issues,
  searchQuery,
  onClearSearch,
}: {
  issues: BoardIssueItem[];
  searchQuery?: string;
  onClearSearch?: () => void;
}) {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set([]));
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());

  const types = useMemo(() => {
    const map = new Map<string, { id: string; name: string; iconURL?: string | null }>();
    issues.forEach((si) => {
      const typeId = si.type.id;
      if (!map.has(typeId)) {
        map.set(typeId, si.type);
      }
    });
    return Array.from(map.values());
  }, [issues]);

  const issuesByType = useMemo(() => {
    const map = new Map<string, BoardIssueItem[]>();
    issues.forEach((si) => {
      const typeId = si.type.id;
      if (!map.has(typeId)) map.set(typeId, []);
      map.get(typeId)!.push(si);
    });
    return map;
  }, [issues]);

  const toggleType = (typeId: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(typeId)) {
      newExpanded.delete(typeId);
    } else {
      newExpanded.add(typeId);
    }
    setExpandedTypes(newExpanded);
  };

  const toggleSelectAll = () => {
    if (selectedIssues.size === issues.length) {
      setSelectedIssues(new Set());
    } else {
      setSelectedIssues(new Set(issues.map((si) => si.id)));
    }
  };

  const toggleSelectIssue = (issueId: string) => {
    const newSelected = new Set(selectedIssues);
    if (newSelected.has(issueId)) {
      newSelected.delete(issueId);
    } else {
      newSelected.add(issueId);
    }
    setSelectedIssues(newSelected);
  };

  if (issues.length === 0 && searchQuery) {
    return <NoSearchResults query={searchQuery} onClear={onClearSearch || (() => {})} />;
  }

  if (issues.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title='No issues in this sprint'
        description='Start by adding issues from the backlog or create new ones directly.'
        action={{
          label: 'Create issue',
          onClick: () => {},
        }}
      />
    );
  }

  return (
    <div className='p-4'>
      {/* Bulk actions bar */}
      {selectedIssues.size > 0 && (
        <div className='mb-4 p-3 bg-primary/10 rounded-lg flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Checkbox
              checked={selectedIssues.size === issues.length}
              onCheckedChange={toggleSelectAll}
            />
            <span className='text-sm font-medium'>
              {selectedIssues.size} issue{selectedIssues.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm'>
              <UserIcon className='h-4 w-4 mr-2' />
              Assign
            </Button>
            <Button variant='outline' size='sm'>
              <Play className='h-4 w-4 mr-2' />
              Change status
            </Button>
            <Button variant='outline' size='sm' className='text-destructive'>
              <Trash2 className='h-4 w-4 mr-2' />
              Remove
            </Button>
          </div>
        </div>
      )}

      <div className='rounded-lg border bg-card overflow-hidden'>
        {/* Table header */}
        <div className='flex items-center gap-3 px-4 py-2 bg-slate-50 border-b text-xs font-medium text-muted-foreground'>
          <Checkbox
            checked={selectedIssues.size === issues.length && issues.length > 0}
            onCheckedChange={toggleSelectAll}
            className='mr-1'
          />
          <div className='w-6' />
          <div className='w-4' />
          <div className='w-20'>Key</div>
          <div className='flex-1'>Summary</div>
          <div className='w-24'>Status</div>
          <div className='w-8'>P</div>
          <div className='w-8'>SP</div>
          <div className='w-8'>Assignee</div>
        </div>

        {types.map((type) => {
          const issues = issuesByType.get(type.id) || [];
          if (issues.length === 0) return null;

          const isExpanded = expandedTypes.has(type.id);
          const totalPoints = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);

          return (
            <div key={type.id} className='border-b last:border-b-0'>
              <button
                onClick={() => toggleType(type.id)}
                className='w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left'
              >
                {isExpanded ? (
                  <ChevronDown className='h-4 w-4 text-muted-foreground' />
                ) : (
                  <ChevronRight className='h-4 w-4 text-muted-foreground' />
                )}
                <IssueTypeIcon type={type} />
                <span className='font-medium text-sm'>{type.name}</span>
                <Badge variant='secondary' className='text-xs'>
                  {issues.length}
                </Badge>
                <span className='text-xs text-muted-foreground ml-auto'>
                  {totalPoints} story points
                </span>
              </button>

              {isExpanded && (
                <div className='border-t bg-white'>
                  {issues.map((issue) => (
                    <div
                      key={issue.id}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0 hover:bg-slate-50 cursor-pointer transition-colors group',
                        selectedIssues.has(issue.id) && 'bg-primary/5',
                      )}
                    >
                      <Checkbox
                        checked={selectedIssues.has(issue.id)}
                        onCheckedChange={() => toggleSelectIssue(issue.id)}
                      />
                      <div className='w-6'>
                        <GripVertical className='h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab' />
                      </div>
                      <IssueTypeIcon type={issue.type} />
                      <span className='text-sm text-muted-foreground font-medium w-20 hover:text-primary hover:underline'>
                        {issue.key}
                      </span>
                      <span className='text-sm font-medium flex-1 truncate'>{issue.summary}</span>
                      <StatusBadge status={issue.status} />
                      <PriorityIcon priority={issue.priority} />
                      <StoryPointsBadge points={issue.storyPoints ?? undefined} />
                      <UserAvatar user={issue.assignee ?? undefined} size='sm' />
                      <IssueQuickActions issue={issue} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
