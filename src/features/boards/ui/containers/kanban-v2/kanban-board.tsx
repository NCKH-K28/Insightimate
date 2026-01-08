'use client';

import React, { useRef } from 'react';
import { Provider as JotaiProvider, createStore, useAtom } from 'jotai';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  SortableContext,
  arrayMove,
} from '@dnd-kit/sortable';
import {
  boardAtom,
  parseColId,
  parseColEndId,
  parseItemId,
  findItem,
  clamp,
  Board,
  ColumnItem,
  Column,
  colDndId,
  getOverColumnIdForColumnDrag,
  KanbanBoardRef,
} from './ui';
import { BoardColumn } from './board-column';
import { IssueCard } from './issue-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useUpdateEffect } from 'react-use';
import { useImperativeHandle } from 'react';

type KanbanBoardInnerProps = {
  onMove?: (e: { from: string; to: string }, board: Board) => void;
  onAddColumn?: (e: { name: string }, board: Board) => void;
  onRemoveColumn?: (e: { columnId: string }, board: Board) => void;
  onAddItem: (e: { columnId: string; name: string }, board: Board) => void;
  onRemoveItem: (e: { columnId: string; itemId: string }, board: Board) => void;
  onEditColumn?: (e: { column: Column }, board: Board) => void;
  onEditItem?: (e: { item: ColumnItem }, board: Board) => void;
  onColumnReorder?: (e: { columns: Column[] }, board: Board) => void;
};

function KanbanBoardInner({
  onMove,
  onRemoveColumn,
  onAddItem,
  onRemoveItem,
  onAddColumn,
  onEditColumn,
  onEditItem,
  onColumnReorder,
}: KanbanBoardInnerProps) {
  const [board, setBoard] = useAtom(boardAtom);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [activeItemId, setActiveItemId] = React.useState<string | null>(null);
  const [activeColumnId, setActiveColumnId] = React.useState<string | null>(null);
  const [overColumnId, setOverColumnId] = React.useState<string | null>(null);
  const [overIndex, setOverIndex] = React.useState<number | null>(null);

  const activeItem = React.useMemo(() => {
    if (!activeItemId) return null;
    return findItem(board, activeItemId)?.item ?? null;
  }, [board, activeItemId]);

  const activeColumn = React.useMemo(() => {
    if (!activeColumnId) return null;
    return board.columns.find((c) => c.id === activeColumnId) ?? null;
  }, [board, activeColumnId]);

  const columnIds = React.useMemo(() => board.columns.map((c) => colDndId(c.id)), [board.columns]);

  // Compute position for item drag
  const computeOverPosition = React.useCallback(
    (overIdRaw: string | null, activeItemIdLocal: string | null) => {
      if (!overIdRaw || !activeItemIdLocal)
        return { columnId: null as string | null, index: null as number | null };

      const overEndCol = parseColEndId(overIdRaw);
      if (overEndCol) {
        const col = board.columns.find((c) => c.id === overEndCol);
        // Dropping on the end-zone means append to the end
        return { columnId: overEndCol, index: col ? col.items.length : 0 };
      }

      const overCol = parseColId(overIdRaw);
      if (overCol) {
        // Dropping directly on the column container (empty column case)
        const col = board.columns.find((c) => c.id === overCol);
        return { columnId: overCol, index: col ? col.items.length : 0 };
      }

      const overItem = parseItemId(overIdRaw);
      if (overItem) {
        const found = findItem(board, overItem);
        if (!found) return { columnId: null, index: null };
        return { columnId: found.columnId, index: found.index };
      }

      return { columnId: null, index: null };
    },
    [board],
  );

  const moveRef = useRef<{ from: string; to: string } | null>(null);

  const onDragStart = React.useCallback(
    (e: DragStartEvent) => {
      const id = String(e.active.id);

      // Check for column
      const colId = parseColId(id);
      if (colId) {
        setActiveColumnId(colId);
        return;
      }

      const itemId = parseItemId(id);
      if (!itemId) return;
      setActiveItemId(itemId);

      const found = findItem(board, itemId);
      if (!found) return;
      // Record initial position for onMove callback
      const from = `/cols/${found.columnId}/items/${found.item.id}`;
      moveRef.current = { from, to: from };
    },
    [board],
  );

  const onDragOver = React.useCallback(
    (e: DragOverEvent) => {
      // If dragging a column, we skip item reordering logic
      if (activeColumnId) {
        return;
      }

      const overId = e.over?.id ? String(e.over.id) : null;
      const pos = computeOverPosition(overId, activeItemId);
      setOverColumnId(pos.columnId);
      setOverIndex(pos.index);
    },
    [computeOverPosition, activeItemId, activeColumnId],
  );

  const onDragEnd = React.useCallback(
    (e: DragEndEvent) => {
      const activeRaw = String(e.active.id);
      const overRaw = e.over?.id ? String(e.over.id) : null;

      // === Column Drop ===
      const aColId = parseColId(activeRaw);
      if (aColId) {
        if (!overRaw) {
          setActiveColumnId(null);
          return;
        }

        // Use the robust helper to find the target column even if overRaw is an item
        const oColId = getOverColumnIdForColumnDrag(overRaw, board);

        if (oColId && aColId !== oColId) {
          let nextColumns: Column[] | null = null;
          setBoard((prev) => {
            const oldIdx = prev.columns.findIndex((c) => c.id === aColId);
            const newIdx = prev.columns.findIndex((c) => c.id === oColId);
            if (oldIdx === -1 || newIdx === -1) return prev;

            nextColumns = arrayMove(prev.columns, oldIdx, newIdx);
            return { ...prev, columns: nextColumns };
          });
          if (nextColumns) onColumnReorder?.({ columns: nextColumns }, board);
        }
        setActiveColumnId(null);
        return;
      }

      // === Item Drop ===
      const aId = parseItemId(activeRaw);
      if (!aId) {
        setActiveItemId(null);
        setOverColumnId(null);
        setOverIndex(null);
        return;
      }

      const src = findItem(board, aId);
      const pos = computeOverPosition(overRaw, aId);

      // Trigger the external onMove callback if the position changed
      if (src && pos.columnId && pos.index !== null && moveRef.current) {
        const dstCol = board.columns.find((c) => c.id === pos.columnId);
        if (dstCol) {
          let toIndex = pos.index;
          // Adjust index if moving within the same column downwards
          if (src.columnId === dstCol.id && src.index < toIndex) toIndex -= 1;
          toIndex = clamp(toIndex, 0, dstCol.items.length);

          const beforeItemId = dstCol.items[toIndex]?.id ?? 'bottom';
          onMove?.(
            { from: moveRef.current.from, to: `/cols/${dstCol.id}/items/${beforeItemId}` },
            board,
          );
        }
      }

      if (!src || !pos.columnId || pos.index === null) {
        setActiveItemId(null);
        setOverColumnId(null);
        setOverIndex(null);
        return;
      }

      // Optimistically update the board state
      setBoard((prev) => {
        const srcColIdx = prev.columns.findIndex((c) => c.id === src.columnId);
        const dstColIdx = prev.columns.findIndex((c) => c.id === pos.columnId);
        if (srcColIdx === -1 || dstColIdx === -1) return prev;

        const next: Board = {
          columns: prev.columns.map((c) => ({ ...c, items: [...c.items] })),
        };

        const srcCol = next.columns[srcColIdx];
        const dstCol = next.columns[dstColIdx];

        const fromIndex = srcCol.items.findIndex((it) => it.id === aId);
        if (fromIndex === -1) return prev;

        const [moved] = srcCol.items.splice(fromIndex, 1);
        if (!moved) return prev;

        moved.columnId = dstCol.id;

        let toIndex = pos.index;
        if (toIndex !== null) {
          if (srcCol.id === dstCol.id && fromIndex < toIndex) toIndex -= 1;
          toIndex = clamp(toIndex, 0, dstCol.items.length);
          dstCol.items.splice(toIndex, 0, moved);
        }

        return next;
      });

      setActiveItemId(null);
      setOverColumnId(null);
      setOverIndex(null);
    },
    [board, setBoard, computeOverPosition, onMove, onColumnReorder],
  );

  const onDragCancel = React.useCallback(() => {
    setActiveItemId(null);
    setActiveColumnId(null);
    setOverColumnId(null);
    setOverIndex(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 12 }}>
        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          {board.columns.map((col) => (
            <BoardColumn
              key={col.id}
              column={col}
              activeItemId={activeItemId}
              overColumnId={overColumnId}
              overIndex={overIndex}
              onAddItem={(colId) => onAddItem({ columnId: colId, name: 'New Item' }, board)}
              onRemoveItem={(colId, itemId) => onRemoveItem({ columnId: colId, itemId }, board)}
              onRemoveColumn={(colId) => onRemoveColumn?.({ columnId: colId }, board)}
              onEditColumn={(col) => onEditColumn?.({ column: col }, board)}
              onEditItem={(item) => onEditItem?.({ item }, board)}
            />
          ))}
        </SortableContext>

        <Button
          variant='outline'
          className='flex items-center gap-2'
          onClick={() => onAddColumn?.({ name: 'New Column' }, board)}
        >
          <Plus />
          Add Column
        </Button>
      </div>

      <DragOverlay>
        {activeItem ? <IssueCard item={activeItem} /> : null}
        {activeColumn ? (
          <div style={{ opacity: 0.8 }}>
            <BoardColumn
              column={activeColumn}
              activeItemId={null}
              overColumnId={null}
              overIndex={null}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

type KanbanBoardProps = KanbanBoardInnerProps & { board: Board };
export const KanbanBoard = React.forwardRef<KanbanBoardRef, KanbanBoardProps>(
  (
    {
      board,
      onMove,
      onAddColumn,
      onRemoveColumn,
      onAddItem,
      onRemoveItem,
      onEditColumn,
      onEditItem,
      onColumnReorder,
    },
    ref,
  ) => {
    const [store] = React.useState(() => {
      const s = createStore();
      s.set(boardAtom, board);
      return s;
    });

    useImperativeHandle(ref, () => ({
      getBoard: () => store.get(boardAtom),
      addColumn: (input) => {
        store.set(boardAtom, (prev) => ({ ...prev, columns: [...prev.columns, input] }));
      },
      addItem: (input) => {
        store.set(boardAtom, (prev) => ({
          ...prev,
          columns: prev.columns.map((col) =>
            col.id === input.columnId ? { ...col, items: [...col.items, input] } : col,
          ),
        }));
      },
      updateColumn: (input) => {
        store.set(boardAtom, (prev) => {
          const column = prev.columns.find((col) => col.id === input.id);
          if (!column) return prev;
          const nextColumns = prev.columns.map((col) =>
            col.id === input.id ? { ...col, data: input.data } : col,
          );
          return { ...prev, columns: nextColumns };
        });
      },
      updateItem: (input) => {
        store.set(boardAtom, (prev) => {
          let changed = false;
          const nextColumns = prev.columns.map((col) => {
            const idx = col.items.findIndex((it) => it.id === input.id);
            if (idx === -1) return col;
            changed = true;
            const nextItems = col.items.slice();
            nextItems[idx] = { ...nextItems[idx], data: input.data };
            return { ...col, items: nextItems };
          });
          return changed ? { ...prev, columns: nextColumns } : prev;
        });
      },
      removeColumn: (input) => {
        store.set(boardAtom, (prev) => ({
          ...prev,
          columns: prev.columns.filter((col) => col.id !== input.id),
        }));
      },
      removeItem: (input) => {
        store.set(boardAtom, (prev) => {
          let changed = false;
          const nextColumns = prev.columns.map((col) => {
            const idx = col.items.findIndex((it) => it.id === input.id);
            if (idx === -1) return col;
            changed = true;
            const nextItems = col.items.slice();
            nextItems.splice(idx, 1);
            return { ...col, items: nextItems };
          });
          return changed ? { ...prev, columns: nextColumns } : prev;
        });
      },
    }));

    useUpdateEffect(() => {
      store.set(boardAtom, board);
    }, [board]);

    return (
      <JotaiProvider store={store}>
        <KanbanBoardInner
          onMove={onMove}
          onAddColumn={onAddColumn}
          onRemoveColumn={onRemoveColumn}
          onAddItem={onAddItem}
          onRemoveItem={onRemoveItem}
          onEditColumn={onEditColumn}
          onEditItem={onEditItem}
          onColumnReorder={onColumnReorder}
        />
      </JotaiProvider>
    );
  },
);
KanbanBoard.displayName = 'KanbanBoard';
