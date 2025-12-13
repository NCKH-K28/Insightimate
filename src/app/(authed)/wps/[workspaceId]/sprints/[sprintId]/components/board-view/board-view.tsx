'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Inbox } from 'lucide-react';

import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { BoardColumnSkeleton } from '../BoardColumnSkeleton';
import { IssueCard } from './issue-card';
import { BoardColumn } from './board-column';
import { BoardColumnItem, BoardIssueItem } from '@/contracts/boards/boards.query';

type EmptyStateProps = {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
};
function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
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

type BoardViewProps = {
  columns: BoardColumnItem[];
  items: BoardIssueItem[];
  isLoading?: boolean;
};

export function BoardView({ columns, items, isLoading }: BoardViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const issuesByColumn = useMemo(() => {
    const map = new Map<string, BoardIssueItem[]>();
    columns.forEach((col) => {
      const statusIds = col.statuses.map((s) => s.id);
      const columnIssues = items.filter((si) => statusIds.includes(si.status.id));
      // log
      console.log(`Column ${col.name} has issues:`, columnIssues);

      map.set(col.id, columnIssues);
    });
    return map;
  }, [columns, items]);

  const activeIssue = useMemo(() => {
    if (!activeId) return null;
    for (const si of items) if (si.id === activeId) return si;
    return null;
  }, [activeId, items]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string | null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) toast.success('Issue has been moved successfully');

    setActiveId(null);
    setOverId(null);
  };

  if (isLoading) {
    return (
      <ScrollArea className='w-full'>
        <div className='flex gap-4 p-4 min-w-max'>
          {[1, 2, 3, 4].map((i) => (
            <BoardColumnSkeleton key={i} />
          ))}
        </div>
        <ScrollBar orientation='horizontal' />
      </ScrollArea>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title='No issues in this sprint'
        description='Start by adding issues from the backlog or create new ones directly.'
        action={{ label: 'Create issue', onClick: () => {} }}
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea className='w-full'>
        <div className='flex gap-4 p-4 min-w-max'>
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              issues={issuesByColumn.get(column.id) || []}
              isOver={overId === column.id}
            />
          ))}
        </div>
        <ScrollBar orientation='horizontal' />
      </ScrollArea>

      <DragOverlay>{activeIssue && <IssueCard issue={activeIssue} isDragging />}</DragOverlay>
    </DndContext>
  );
}
