'use client';

import { useCallback, useMemo } from 'react';

import { Card, Column, MoveRelative } from '@/features/boards/ui/containers/kanbanV2/types';
import { KanbanBoard } from '@/features/boards/ui/containers/kanbanV2';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  listBoardIssuesQueryOptions,
  moveBoardIssueMutationOptions,
} from '@/features/boards/api/actions';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { getProjectQueryOptions } from '@/features/projects/api/actions';
import { toast } from 'sonner';

type KanbanTabProps = { params: { boardId: string; projectId: string; workspaceId: string } };
export default function KanbanTab({ params }: KanbanTabProps) {
  const boardId = params.boardId;
  // const { data: board } = useSuspenseQuery(getBoardQueryOptions(boardId));
  const { data: statuses } = useSuspenseQuery({
    ...getProjectQueryOptions(params),
    select: (res) => res.statuses,
  });
  const { data: issues, isPending } = useQuery(
    listBoardIssuesQueryOptions(boardId, {
      filter: { type: 'KANBAN', issueType: { hierarchy: 1 } },
    }),
  );

  const mapToColumns = useCallback((cols: Exclude<typeof statuses, undefined>): Column[] => {
    return cols.map((col, index) => ({
      id: col.id,
      title: col.name,
      order: index + 1,
      color: col.color,
    }));
  }, []);

  const mapToCards = useCallback((iss: Exclude<typeof issues, undefined>): Card[] => {
    const sortedIss = [...iss].sort((a, b) => {
      if (!a.rank) return 1;
      if (!b.rank) return -1;
      return a.rank - b.rank;
    });

    return sortedIss.map((issue, index) => ({
      id: issue.id,
      columnId: issue.statusId,
      title: issue.summary,
      description: issue.description || undefined,
      order: index + 1,
      data: {
        type: issue.type,
        priority: issue.priority,
        assignee: issue.assignee,
        reporter: issue.reporter,
        dueDate: issue.dueDate,
      },
    }));
  }, []);

  const moveIssue = useMutation(moveBoardIssueMutationOptions(params));

  const columns = useMemo(() => mapToColumns(statuses || []), [statuses, mapToColumns]);
  const cards = useMemo(() => mapToCards(issues || []), [issues, mapToCards]);

  const handleMove = useCallback(
    (cardId: string, move: MoveRelative) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;

      toast.promise(
        moveIssue.mutateAsync({
          issueId: cardId,
          parentType: 'status',
          from: { parentId: card.columnId },
          to: { parentId: move.columnId || card.columnId },
          relative:
            move.position === 'after'
              ? { type: 'after', refId: move.afterId }
              : { type: move.position === 'top' ? 'top' : 'bottom' },
        }),
        {
          loading: 'Moving card...',
          success: 'Card moved',
          error: 'Failed to move card',
        },
      );
    },
    [cards, moveIssue],
  );

  if (isPending) return <KanbanTabSkeleton />;
  if (!issues || !statuses) return <div>No data available</div>;

  // log
  console.log('KanbanTab columns:', columns);
  console.log('KanbanTab cards:', cards);

  return (
    <div className={cn('size-full flex flex-col gap-2', 'overflow-hidden')}>
      <header className='px-2'>
        <h1 className='text-2xl font-bold'>Kanban Board</h1>
        <p className='text-muted-foreground text-sm mt-1'>
          Drag and drop cards to organize your tasks
        </p>
      </header>

      <Separator />

      <div className='flex-1 relative overflow-hidden'>
        <div className='absolute inset-0 z-0'>
          <KanbanBoard columns={columns} cards={cards} onMove={handleMove} />
        </div>
      </div>
    </div>
  );
}

const KanbanTabSkeleton = () => {
  return (
    <div className={cn('size-full flex flex-col gap-2', 'overflow-hidden')}>
      <header className='px-2'>
        <Skeleton className='h-8 w-1/3 mb-2' />
        <Skeleton className='h-4 w-1/4' />
      </header>

      <Separator />

      <div className='flex-1 relative overflow-hidden'>
        <div className='absolute inset-0 z-0 flex gap-4 px-2 py-4 overflow-x-auto'>
          {[1, 2, 3, 4].map((col) => (
            <div key={col} className='w-72 shrink-0'>
              <Skeleton className='h-6 w-3/4 mb-4' />
              <div className='flex flex-col gap-3'>
                {[1, 2, 3].map((card) => (
                  <Skeleton key={card} className='h-16 w-full' />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
