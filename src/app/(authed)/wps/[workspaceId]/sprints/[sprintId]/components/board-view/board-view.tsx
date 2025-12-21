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
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { useMutation } from '@tanstack/react-query';
import { moveBoardIssueMutationOptions } from '@/features/boards/api/actions';

import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { BoardColumnSkeleton } from '../BoardColumnSkeleton';
import { IssueCard } from './issue-card';
import { BoardColumn } from './board-column';
import { BoardColumnItem, BoardIssueItem } from '@/contracts/boards/boards.query';
import { useAsyncFn } from 'react-use';

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
  // Local state for optimistic updates
  const [tasks, setTasks] = useState<BoardIssueItem[]>(items);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Mutation
  const boardId = items[0]?.boardId || '';
  const moveIssue = useMutation(moveBoardIssueMutationOptions({ boardId }));

  useAsyncFn(async () => {
    if (!activeId) return;
    setTasks(items);
  }, [items, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const issuesByColumn = useMemo(() => {
    const map = new Map<string, BoardIssueItem[]>();
    columns.forEach((col) => {
      const statusIds = col.statuses.map((s) => s.id);
      const columnIssues = tasks.filter((si) => statusIds.includes(si.status.id));
      map.set(col.id, columnIssues);
    });
    return map;
  }, [columns, tasks]);

  const activeIssue = useMemo(() => {
    if (!activeId) return null;
    return tasks.find((t) => t.id === activeId) || null;
  }, [activeId, tasks]);

  // Helper to find the container (column) of an item
  const findContainer = (id: string, currentTasks: BoardIssueItem[]) => {
    if (columns.some((c) => c.id === id)) return id;
    const item = currentTasks.find((t) => t.id === id);
    if (!item) return null;
    const col = columns.find((c) => c.statuses.some((s) => s.id === item.status.id));
    return col?.id || null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id === overId) return;

    const activeIssueId = active.id as string;
    const overStringId = overId as string;

    // Find containers
    const activeContainer = findContainer(activeIssueId, tasks);
    const overContainer = findContainer(overStringId, tasks);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Moving between columns or reordering
    setTasks((prev) => {
      const activeItems = prev;
      const activeIndex = activeItems.findIndex((i) => i.id === activeIssueId);
      const overIndex = activeItems.findIndex((i) => i.id === overStringId);

      if (activeIndex === -1 || overIndex === -1) return prev; // Should not happen

      const activeItem = activeItems[activeIndex];
      const targetColumn = columns.find((c) => c.id === overContainer);

      if (!targetColumn || !activeItem) return prev;

      // 1. If different container, update status
      const newStatus = targetColumn.statuses[0];
      const differentContainer = activeItem.status.id !== newStatus.id;

      let updatedItem = activeItem;
      if (activeContainer !== overContainer) {
        updatedItem = { ...activeItem, status: { ...activeItem.status, ...newStatus } };
      }

      // 2. Move
      const movedTasks = arrayMove(prev, activeIndex, overIndex);

      // If we updated the item (status change), we need to replace it in the new array at the new index
      // arrayMove returns a new array where item at `activeIndex` is moved to `overIndex`.
      // So the item at `overIndex` in `movedTasks` IS the active item.
      if (differentContainer) {
        movedTasks[overIndex] = updatedItem;
      }

      return movedTasks;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeIssueId = active.id as string;
    const overId = over?.id as string;

    setActiveId(null);
    setOverId(null);

    if (!over) {
      setTasks(items);
      return;
    }

    if (activeIssueId === overId) return;

    // Use items (props) for the source of truth for the mutation logic basics,
    // but the `overId` tells us where we dropped.
    const activeIssue = items.find((i) => i.id === activeIssueId);
    if (!activeIssue) return;

    // Must determine containers based on where things ARE in the UI (tasks) OR where they were?
    // If we optimistically updated, `activeIssueId` in `tasks` gives us the NEW location.
    // But `overId` is the drop target.
    // The previous logic relied on `activeIssue.status.id` (original) vs `overId`'s container.
    // `activeIssue` from `items` is the original state. Correct.

    // We need to find the TARGET container based on `overId`.
    // If `overId` is a column, simple.
    // If `overId` is an item, we look at the column of `overId`.
    // NOTE: `overId` item might ALSO have moved in `tasks`.
    // But usually `overId` refers to an item effectively "stationary" relative to the drag action or whatever.
    // Let's use `tasks` to find the container of `overId` to be consistent with what the user sees.
    const targetColumnId = findContainer(overId, tasks);

    // Source column is original active issue's column (from props)
    const sourceColumnId = findContainer(activeIssueId, items); // original container

    if (!sourceColumnId || !targetColumnId) {
      setTasks(items);
      return;
    }

    const targetColumn = columns.find((c) => c.id === targetColumnId);
    if (!targetColumn) {
      setTasks(items);
      return;
    }

    // Determine relative position
    if (targetColumnId === overId) {
      const newStatus = targetColumn.statuses[0];
      if (!newStatus) return;

      toast.promise(
        moveIssue.mutateAsync({
          issueId: activeIssueId,
          parentType: 'status',
          from: { parentId: activeIssue.status.id },
          to: { parentId: newStatus.id },
          relative: { type: 'bottom' },
        }),
        {
          loading: 'Moving issue...',
          success: 'Issue moved successfully',
          error: 'Failed to move issue',
        },
      );
      return;
    }

    // Dropped relative to another item
    // We need the ID of the item we dropped over.
    // Note: `issuesByColumn` is derived from `tasks`.
    // The visual order comes from `SortableContext` which usually matches `tasks` filtered order.

    const targetIssues = issuesByColumn.get(targetColumnId) || [];
    const overIndex = targetIssues.findIndex((i) => i.id === overId);

    // We need to know if we dropped "before" or "after" `overId`.
    // In `handleDragOver` we might have already moved it?
    // `dnd-kit` doesn't persistently reorder the array in `handleDragOver` unless we used `arrayMove`.
    // We only updated the Status. So in `tasks`, the item is appended to the groups or stays in original index but maps to new column.
    // Wait, `tasks.filter` preserves relative order.
    // So if I drag item 0 to column B (100 items), it appears... at the top/bottom depending on `tasks` order?

    // This implies `handleDragOver` implementation above was incomplete for "exact index".
    // I only updated status. If the item was at index 0 of `tasks`, and I change status to Col B.
    // It will appear at the "top" of Col B (relative to other Col B items in `tasks`?).
    // If Col B items are at indices 50-60. Item at 0 will be before them.
    // So it appears at top.
    // Correct.

    // So for "exact index", I MUST `arrayMove` the item in `tasks` to be close to `overId`'s index in `tasks`.
    // Updated Logic in DragEnd:
    // We'll calculate relative position based on valid "visual" feedback.
    // But since `handleDragOver` didn't reshape `tasks` except status, the placeholder might have been at the wrong place (top/bottom)
    // depending on the original array order.
    // However, fixing `handleDragOver` to `arrayMove` is risky/complex without testing.
    // The prompt requires: "Placeholder appears... at correct position".
    // My previous thought process realized `arrayMove` is needed.
    // I will add `arrayMove` to `handleDragOver`.

    // Let's refine `handleDragOver` first in this block.
    // Wait, I can't restart the tool call mid-string easily.
    // I will write the `handleDragOver` with `arrayMove` here.

    // ... relativeType calculation needs to be robust.
    const activeIndex = targetIssues.findIndex((i) => i.id === activeIssueId);
    // If activeIndex is -1, it means `tasks` doesn't have it in that column?
    // But we optimistically updated `tasks`?
    // In `handleDragEnd`, `tasks` has it in `current` status.

    let relativeType: 'before' | 'after' = 'before';
    if (activeIndex !== -1) {
      relativeType = activeIndex < overIndex ? 'after' : 'before';
      // We can rely on indices in the *optimistic* list, assuming `SortableContext` respects it.
      // actually if `handleDragOver` did `arrayMove` correctly, then `active` is indeed neighbor to `over`.
    }

    // Fallback: Default to 'before' drop target.
    // ...

    const overItem = items.find((i) => i.id === overId) || tasks.find((i) => i.id === overId);
    const targetStatusId = overItem ? overItem.status.id : targetColumn.statuses[0].id;

    toast.promise(
      moveIssue.mutateAsync({
        issueId: activeIssueId,
        parentType: 'status',
        from: { parentId: activeIssue.status.id },
        to: { parentId: targetStatusId },
        relative: { type: relativeType, refId: overId },
      }),
      {
        loading: 'Moving issue...',
        success: 'Issue moved successfully',
        error: 'Failed to move issue',
      },
    );
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
