'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { KanbanCard } from './kanban-card';
import { ColumnHeader } from './column-header';
import { AddCardButton } from './add-card-button';
import type { Card, Column } from './types';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  column: Column;
  cards: Card[];
  onTitleChange: (columnId: string, newTitle: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onAddCard: (columnId: string) => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (cardId: string) => void;
}

export function KanbanColumn({
  column,
  cards,
  onTitleChange,
  onDeleteColumn,
  onAddCard,
  onEditCard,
  onDeleteCard,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: 'column', column },
  });

  const sortedCards = [...cards].sort((a, b) => a.order - b.order);
  const cardIds = sortedCards.map((card) => card.id);

  return (
    <div
      className={cn(
        'w-72',
        'max-h-full overflow-hidden',
        'bg-muted/50 rounded-lg p-2',
        'grid grid-rows-[auto_minmax(0,1fr)_auto]',
        { 'ring-2 ring-primary ring-inset': isOver },
      )}
    >
      <ColumnHeader
        column={column}
        cardCount={cards.length}
        onTitleChange={onTitleChange}
        onDelete={onDeleteColumn}
      />

      <div className='flex-1'>
        <ScrollArea className={cn('w-full h-full', 'min-h-[100px] max-h-full')}>
          <div ref={setNodeRef} className='flex flex-col gap-2'>
            <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
              {sortedCards.map((card) => (
                <KanbanCard key={card.id} card={card} onEdit={onEditCard} onDelete={onDeleteCard} />
              ))}
            </SortableContext>

            <ScrollBar orientation='vertical' />

            {/* Empty state placeholder */}
            {cards.length === 0 && (
              <div className='text-center py-8 text-muted-foreground text-sm'>No cards yet</div>
            )}
          </div>
        </ScrollArea>
      </div>

      <AddCardButton onClick={() => onAddCard(column.id)} />
    </div>
  );
}
