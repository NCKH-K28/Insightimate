'use client';

import React from 'react';
import { MoreHorizontal, Plus, Settings, Inbox } from 'lucide-react';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

import { cn } from '@/lib/utils';
import { IssueCard } from './issue-card';
import { BoardColumnItem, BoardIssueItem } from '@/contracts/boards/boards.query';

type DraggableIssueCardProps = { issue: BoardIssueItem; isDragging?: boolean };
function DraggableIssueCard({ issue, isDragging = false }: DraggableIssueCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: issue.id });

  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style}>
      <IssueCard
        issue={issue}
        isDragging={isDragging || isSortableDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

type BoardColumnProps = { column: BoardColumnItem; issues: BoardIssueItem[]; isOver?: boolean };
export function BoardColumn({ column, issues, isOver }: BoardColumnProps) {
  const { setNodeRef } = useDroppable({ id: column.id });
  const totalPoints = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'shrink-0 w-72 bg-slate-50 rounded-lg transition-all duration-200',
        isOver && 'ring-2 ring-primary ring-offset-2 bg-primary/5',
      )}
    >
      <div className='p-3 border-b border-slate-200'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <h3 className='font-semibold text-sm text-slate-700'>{column.name}</h3>
            <Badge variant='secondary' className={cn('text-xs')}>
              {issues.length}
            </Badge>
          </div>
          <div className='flex items-center gap-1'>
            <span className='text-xs text-muted-foreground'>{totalPoints} pts</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='h-6 w-6'>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem>
                  <Settings className='h-4 w-4 mr-2' />
                  Column settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Plus className='h-4 w-4 mr-2' />
                  Set WIP limit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <ScrollArea className='h-[calc(100vh-380px)]'>
        <div className='p-2'>
          <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {issues.map((issue) => (
              <DraggableIssueCard key={issue.id} issue={issue} />
            ))}
          </SortableContext>

          {issues.length === 0 && (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <Inbox className='h-8 w-8 text-slate-300 mb-2' />
              <p className='text-xs text-muted-foreground'>Drop issues here</p>
            </div>
          )}

          <Button
            variant='ghost'
            className='w-full justify-start text-muted-foreground hover:text-foreground mt-2'
          >
            <Plus className='h-4 w-4 mr-2' />
            Create issue
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
