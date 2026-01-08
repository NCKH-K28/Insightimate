'use client';

import React from 'react';
import {
  MoreHorizontal,
  Play,
  User as UserIcon,
  GripVertical,
  Eye,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { IssueTypeIcon, PriorityIcon, UserAvatar, StoryPointsBadge } from './helper-components';
import { BoardIssueItem } from '@/contracts/boards/board.query';

type IssueQuickActionsProps = {
  issue: BoardIssueItem;
  onDelete?: () => void;
};
function IssueQuickActions({ issue, onDelete }: IssueQuickActionsProps) {
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
            <DropdownMenuItem>
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

type IssueCardProps = {
  issue: BoardIssueItem;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
};

export function IssueCard({ issue, isDragging = false, dragHandleProps }: IssueCardProps) {
  return (
    <Card
      className={cn(
        'mb-2 cursor-pointer transition-all duration-200 group',
        'hover:shadow-md hover:border-slate-300',
        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
        'p-0',
        isDragging && 'shadow-lg ring-2 ring-primary rotate-2 opacity-90',
      )}
      tabIndex={0}
      role='button'
      aria-label={`Issue ${issue.key}: ${issue.summary}`}
    >
      <CardContent className='p-3'>
        <div className='flex items-start justify-between gap-2 mb-2'>
          <div className='flex items-center gap-1.5'>
            {dragHandleProps && (
              <Button
                {...dragHandleProps}
                size='icon'
                variant='ghost'
                className={cn('size-4')}
                aria-label='Drag to reorder'
              >
                <GripVertical className='h-4 w-4 text-slate-400' />
              </Button>
            )}
            <IssueTypeIcon type={issue.type} />
            <span className='text-xs text-muted-foreground font-medium hover:text-primary hover:underline'>
              {issue.key}
            </span>
          </div>
          <div className='flex items-center gap-1'>
            <IssueQuickActions issue={issue} />
          </div>
        </div>

        <p className='text-sm font-medium text-foreground leading-snug mb-3 line-clamp-2'>
          {issue.summary}
        </p>

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <StoryPointsBadge points={issue.storyPoints ?? undefined} />
            <PriorityIcon priority={issue.priority} />
          </div>
          <UserAvatar user={issue.assignee ?? undefined} size='sm' />
        </div>
      </CardContent>
    </Card>
  );
}
