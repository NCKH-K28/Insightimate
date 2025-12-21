'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Card as CardUI, CardContent, CardHeader } from '@/components/ui/card';
import { KanbanColumn } from './kanban-column';
import { AddColumnButton } from './add-column-button';
import { EditCardDialog } from './edit-card-dialog';
import type { Card, Column, KanbanBoardProps, MoveRelative } from './types';
import { cn } from '@/lib/utils';
// import { useMutation } from '@tanstack/react-query';

// Generate unique IDs for new items
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function KanbanBoard({
  columns: initialColumns,
  cards: initialCards,
  onMove,
  onColumnChange,
  onCardChange,
}: KanbanBoardProps) {
  // Local state for columns and cards
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [cards, setCards] = useState<Card[]>(initialCards);

  // State for tracking active drag
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  // State for card editing dialog
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Sort columns by order
  const sortedColumns = useMemo(() => [...columns].sort((a, b) => a.order - b.order), [columns]);

  // Group cards by column
  const cardsByColumn = useMemo(() => {
    const grouped: Record<string, Card[]> = {};
    columns.forEach((col) => {
      grouped[col.id] = cards.filter((card) => card.columnId === col.id);
    });
    return grouped;
  }, [cards, columns]);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Update columns and notify parent
  const updateColumns = useCallback(
    (newColumns: Column[]) => {
      setColumns(newColumns);
      onColumnChange?.(newColumns);
    },
    [onColumnChange],
  );

  // Update cards and notify parent
  const updateCards = useCallback(
    (newCards: Card[]) => {
      setCards(newCards);
      onCardChange?.(newCards);
    },
    [onCardChange],
  );

  // Add a new column
  const handleAddColumn = useCallback(() => {
    const maxOrder = columns.length > 0 ? Math.max(...columns.map((c) => c.order)) : 0;
    const newColumn: Column = {
      id: generateId(),
      title: 'New column',
      order: maxOrder + 1,
    };
    updateColumns([...columns, newColumn]);
  }, [columns, updateColumns]);

  // Update column title
  const handleColumnTitleChange = useCallback(
    (columnId: string, newTitle: string) => {
      updateColumns(
        columns.map((col) => (col.id === columnId ? { ...col, title: newTitle } : col)),
      );
    },
    [columns, updateColumns],
  );

  // Delete a column and its cards
  const handleDeleteColumn = useCallback(
    (columnId: string) => {
      updateColumns(columns.filter((col) => col.id !== columnId));
      updateCards(cards.filter((card) => card.columnId !== columnId));
    },
    [columns, cards, updateColumns, updateCards],
  );

  // Add a new card to a column
  const handleAddCard = useCallback(
    (columnId: string) => {
      const columnCards = cards.filter((c) => c.columnId === columnId);
      const maxOrder = columnCards.length > 0 ? Math.max(...columnCards.map((c) => c.order)) : 0;
      const newCard: Card = {
        id: generateId(),
        columnId,
        title: 'New card',
        order: maxOrder + 1,
      };
      updateCards([...cards, newCard]);
    },
    [cards, updateCards],
  );

  // Edit a card
  const handleEditCard = useCallback((card: Card) => {
    setEditingCard(card);
    setIsEditDialogOpen(true);
  }, []);

  // Save card edits
  const handleSaveCard = useCallback(
    (cardId: string, title: string, description: string) => {
      updateCards(
        cards.map((card) =>
          card.id === cardId ? { ...card, title, description: description || undefined } : card,
        ),
      );
    },
    [cards, updateCards],
  );

  // Delete a card
  const handleDeleteCard = useCallback(
    (cardId: string) => {
      updateCards(cards.filter((card) => card.id !== cardId));
    },
    [cards, updateCards],
  );

  // Handle drag start - store the active card for overlay
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const card = cards.find((c) => c.id === active.id);
      if (card) {
        setActiveCard(card);
      }
    },
    [cards],
  );

  // Handle drag over - update card's column when dragging over another column
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Find the active card
      const activeCard = cards.find((c) => c.id === activeId);
      if (!activeCard) return;

      // Determine target column
      let targetColumnId: string | null = null;

      // Check if dropping over a column directly
      if (overId.startsWith('column-')) {
        targetColumnId = overId.replace('column-', '');
      } else {
        // Dropping over another card - get that card's column
        const overCard = cards.find((c) => c.id === overId);
        if (overCard) {
          targetColumnId = overCard.columnId;
        }
      }

      // If moving to a different column, update the card's column
      if (targetColumnId && targetColumnId !== activeCard.columnId) {
        updateCards(
          cards.map((card) =>
            card.id === activeId ? { ...card, columnId: targetColumnId } : card,
          ),
        );
      }
    },
    [cards, updateCards],
  );

  // Handle drag end - finalize position and call onMove
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveCard(null);

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeCard = cards.find((c) => c.id === activeId);
      if (!activeCard) return;

      // Determine target column and position
      let targetColumnId: string;
      let move: MoveRelative;

      if (overId.startsWith('column-')) {
        // Dropped on column area (empty or bottom of column)
        targetColumnId = overId.replace('column-', '');
        const columnCards = cards
          .filter((c) => c.columnId === targetColumnId && c.id !== activeId)
          .sort((a, b) => a.order - b.order);

        if (columnCards.length === 0) {
          // Empty column - place at top
          move = { position: 'top', columnId: targetColumnId };
        } else {
          // Column has cards - place at bottom
          move = { position: 'bottom', columnId: targetColumnId };
        }
      } else {
        // Dropped on another card
        const overCard = cards.find((c) => c.id === overId);
        if (!overCard) return;

        targetColumnId = overCard.columnId;

        // Get cards in target column (excluding the dragged card)
        const columnCards = cards
          .filter((c) => c.columnId === targetColumnId && c.id !== activeId)
          .sort((a, b) => a.order - b.order);

        // Find index of the card we dropped on
        const overIndex = columnCards.findIndex((c) => c.id === overId);

        if (overIndex === 0) {
          // Dropped on the first card - position at top
          move = { position: 'top', columnId: targetColumnId };
        } else {
          // Get the card before the drop position
          const cardBefore = columnCards[overIndex - 1];
          if (cardBefore) {
            move = {
              position: 'after',
              afterId: cardBefore.id,
              columnId: targetColumnId,
            };
          } else {
            move = { position: 'top', columnId: targetColumnId };
          }
        }
      }

      // Call onMove with the computed MoveRelative object
      onMove(activeId, move);

      // Update local state - recompute orders
      const columnCards = cards
        .filter((c) => c.columnId === targetColumnId && c.id !== activeId)
        .sort((a, b) => a.order - b.order);

      let newOrder: number;

      if (move.position === 'top') {
        // Place before all cards
        const minOrder = columnCards.length > 0 ? columnCards[0].order : 1;
        newOrder = minOrder - 1;
      } else if (move.position === 'bottom') {
        // Place after all cards
        const maxOrder = columnCards.length > 0 ? columnCards[columnCards.length - 1].order : 0;
        newOrder = maxOrder + 1;
      } else if (move.position === 'after') {
        // Place after specific card
        const afterCard = columnCards.find((c) => c.id === move.afterId);
        const afterIndex = columnCards.findIndex((c) => c.id === move.afterId);
        const nextCard = columnCards[afterIndex + 1];

        if (afterCard && nextCard) {
          // Place between two cards
          newOrder = (afterCard.order + nextCard.order) / 2;
        } else if (afterCard) {
          // Place after the last card
          newOrder = afterCard.order + 1;
        } else {
          newOrder = 1;
        }
      } else {
        newOrder = activeCard.order;
      }

      updateCards(
        cards.map((card) =>
          card.id === activeId ? { ...card, columnId: targetColumnId, order: newOrder } : card,
        ),
      );
    },
    [cards, onMove, updateCards],
  );

  // Empty state - no columns
  if (columns.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-96 gap-4'>
        <div className='text-muted-foreground text-lg'>No columns yet</div>
        <AddColumnButton onClick={handleAddColumn} />
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className={cn('flex w-full max-h-full', 'overflow-y-hidden overflow-x-auto')}>
          <div className={cn('flex items-start gap-4')}>
            {sortedColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                cards={cardsByColumn[column.id] || []}
                onTitleChange={handleColumnTitleChange}
                onDeleteColumn={handleDeleteColumn}
                onAddCard={handleAddCard}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
              />
            ))}

            <AddColumnButton onClick={handleAddColumn} />
          </div>
        </div>

        {/* Drag overlay - shows the dragged card */}
        <DragOverlay>
          {activeCard && (
            <CardUI className='w-72 cursor-grabbing shadow-lg opacity-90'>
              <CardHeader className='p-3 pb-1'>
                <span className='font-medium text-sm'>{activeCard.title}</span>
              </CardHeader>
              {activeCard.description && (
                <CardContent className='p-3 pt-1'>
                  <p className='text-xs text-muted-foreground line-clamp-2'>
                    {activeCard.description}
                  </p>
                </CardContent>
              )}
            </CardUI>
          )}
        </DragOverlay>
      </DndContext>

      {/* Edit card dialog */}
      <EditCardDialog
        card={editingCard}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveCard}
      />
    </>
  );
}
