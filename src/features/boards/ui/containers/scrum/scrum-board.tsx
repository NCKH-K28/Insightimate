/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  useDndContext,
  Announcements,
  useDroppable,
} from '@dnd-kit/core';
import {
  rectSortingStrategy,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ======== Types ========
type DndParams = {
  attributes: ReturnType<typeof useSortable>['attributes'];
  listeners: ReturnType<typeof useSortable>['listeners'];
};

type ItemMoveEvent = {
  type: 'item';
  dest: { rowIndex: number; itemIndex: number };
  source: { rowIndex: number; itemIndex: number };
};

type RowMoveEvent = {
  type: 'row';
  dest: { rowIndex: number };
  source: { rowIndex: number };
};

export type MoveEvent = ItemMoveEvent | RowMoveEvent;

export type MoveRelative =
  | { position: 'top' | 'bottom'; rowId?: string }
  | { position: 'after'; afterId: string; rowId?: string };

export type ScrumItemProps = {
  id: string;
  label: string;
  rowId: string;
  onMove?: (event: MoveEvent, relative: MoveRelative | null) => void;
  renderLabel?: (props: Omit<ScrumItemProps, 'renderLabel'>, dnd: DndParams) => React.ReactNode;
};

export type ScrumRowProps = {
  id: string;
  label: string;
  items: Omit<ScrumItemProps, 'rowId'>[];
  collapsed?: boolean;
  onCollapsedChange?: (rowId: string, collapsed: boolean) => void;
  onMove?: (event: MoveEvent, relative: MoveRelative | null) => void;
  renderRowHeader?: (ctx: {
    row: Omit<ScrumRowProps, 'renderRowHeader'>;
    dnd: DndParams;
    collapsed: boolean;
    toggle: () => void;
    itemCount: number;
  }) => React.ReactNode;
};

export type ScrumBoardProps = {
  className?: string;
  rows: ScrumRowProps[];
  autoExpandOnHoverMs?: number; // default 500; 0 to disable
  /**
   * Callback fired when rows change. When provided, the board operates in controlled mode.
   * @param nextRows - The new array of rows after the move operation
   */
  onRowsChange?: (nextRows: ScrumRowProps[]) => void;
};

// ======== Utils ========
/**
 * Determines the relative position for a move operation.
 * @param rows - Current array of rows
 * @param event - The move event containing destination information
 * @returns Relative positioning information
 */
const getMoveRelativePosition = (rows: ScrumRowProps[], event: MoveEvent): MoveRelative => {
  if (event.type === 'row') {
    const { rowIndex } = event.dest;
    if (rowIndex === 0) return { position: 'top' };
    if (rowIndex >= rows.length - 1) return { position: 'bottom' };
    return { position: 'after', afterId: rows[rowIndex - 1].id };
  }

  const { rowIndex, itemIndex } = event.dest;
  const row = rows[rowIndex];
  if (!row || row.items.length === 0) return { position: 'top', rowId: row?.id };
  if (itemIndex === 0) return { position: 'top', rowId: row.id };
  if (itemIndex >= row.items.length) return { position: 'bottom', rowId: row.id };
  return { position: 'after', afterId: row.items[itemIndex - 1].id, rowId: row.id };
};

/**
 * Moves a row from one position to another.
 * @param rows - Current array of rows
 * @param fromIndex - Source row index
 * @param toIndex - Destination row index
 * @returns New array with moved row
 */
const moveRow = (rows: ScrumRowProps[], fromIndex: number, toIndex: number) => {
  if (fromIndex === toIndex) return rows;
  const newRows = [...rows];
  const [movedRow] = newRows.splice(fromIndex, 1);
  if (!movedRow) return rows;
  newRows.splice(toIndex, 0, movedRow);
  return newRows;
};

/**
 * Moves an item from one position to another, potentially across rows.
 * @param rows - Current array of rows
 * @param from - Source position
 * @param to - Destination position
 * @returns New array with moved item
 */
const moveItem = (
  rows: ScrumRowProps[],
  from: { rowIndex: number; itemIndex: number },
  to: { rowIndex: number; itemIndex: number },
) => {
  const srcRow = rows[from.rowIndex];
  const destRow = rows[to.rowIndex];
  if (!srcRow || !destRow) return rows;

  // Same row movement
  if (from.rowIndex === to.rowIndex) {
    if (from.itemIndex === to.itemIndex) return rows;
    const items = [...srcRow.items];
    const [movedItem] = items.splice(from.itemIndex, 1);
    if (!movedItem) return rows;
    items.splice(to.itemIndex, 0, movedItem);
    return rows.map((row, idx) => (idx === from.rowIndex ? { ...row, items } : row));
  }

  // Cross-row movement
  const srcItems = [...srcRow.items];
  const [movedItem] = srcItems.splice(from.itemIndex, 1);
  if (!movedItem) return rows;
  const destItems = [...destRow.items];
  destItems.splice(to.itemIndex, 0, movedItem);

  return rows.map((row, idx) => {
    if (idx === from.rowIndex) return { ...row, items: srcItems };
    if (idx === to.rowIndex) return { ...row, items: destItems };
    return row;
  });
};

/**
 * Validates row and item IDs for duplicates.
 * @param rows - Array of rows to validate
 */
const validateIds = (rows: ScrumRowProps[]) => {
  const rowIds = new Set<string>();
  const itemIds = new Set<string>();

  for (const row of rows) {
    if (rowIds.has(row.id)) {
      console.warn(`Duplicate row ID detected: ${row.id}`);
    }
    rowIds.add(row.id);

    for (const item of row.items) {
      if (itemIds.has(item.id)) {
        console.warn(`Duplicate item ID detected: ${item.id}`);
      }
      itemIds.add(item.id);
    }
  }
};

// ======== Hooks ========
const useCollapsed = (
  rowId: string,
  controlledValue: boolean | undefined,
  onChange?: (rowId: string, collapsed: boolean) => void,
) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isControlled = controlledValue !== undefined;
  const collapsed = isControlled ? controlledValue : internalCollapsed;

  const toggle = useCallback(() => {
    const nextCollapsed = !collapsed;
    if (!isControlled) {
      setInternalCollapsed(nextCollapsed);
    }
    onChange?.(rowId, nextCollapsed);
  }, [collapsed, isControlled, onChange, rowId]);

  return { collapsed, toggle };
};

const useScrumBoard = ({ rows, onRowsChange, autoExpandOnHoverMs = 500 }: ScrumBoardProps) => {
  const [internalRows, setInternalRows] = useState(rows);
  const [expandTimers, setExpandTimers] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const isControlled = Boolean(onRowsChange);
  const currentRows = isControlled ? rows : internalRows;

  useEffect(() => {
    if (!isControlled) setInternalRows(rows);
    validateIds(rows);
  }, [rows, isControlled]);

  // Performance: Create lookup maps
  const { rowIndexById, itemIndexById } = useMemo(() => {
    const rowMap = new Map<string, number>();
    const itemMap = new Map<string, { rowIndex: number; itemIndex: number }>();

    currentRows.forEach((row, rowIndex) => {
      rowMap.set(row.id, rowIndex);
      row.items.forEach((item, itemIndex) => {
        itemMap.set(item.id, { rowIndex, itemIndex });
      });
    });

    return { rowIndexById: rowMap, itemIndexById: itemMap };
  }, [currentRows]);

  const findRow = useCallback((id: string) => rowIndexById.get(id) ?? -1, [rowIndexById]);

  const findItem = useCallback((id: string) => itemIndexById.get(id) ?? null, [itemIndexById]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const updateRows = useCallback(
    (newRows: ScrumRowProps[]) => {
      if (isControlled) {
        onRowsChange?.(newRows);
      } else {
        setInternalRows(newRows);
      }
    },
    [isControlled, onRowsChange],
  );

  const expandRow = useCallback(
    (rowId: string) => {
      const rowIndex = findRow(rowId);
      if (rowIndex === -1) return;

      const row = currentRows[rowIndex];
      if (!row) return;

      // Trigger onCollapsedChange to expand the row
      row.onCollapsedChange?.(rowId, false);
    },
    [findRow, currentRows],
  );

  const clearExpandTimer = useCallback(
    (rowId: string) => {
      const timer = expandTimers.get(rowId);
      if (timer) {
        clearTimeout(timer);
        setExpandTimers((prev) => {
          const next = new Map(prev);
          next.delete(rowId);
          return next;
        });
      }
    },
    [expandTimers],
  );

  const setExpandTimer = useCallback(
    (rowId: string) => {
      if (autoExpandOnHoverMs <= 0) return;

      clearExpandTimer(rowId);

      const timer = setTimeout(() => {
        expandRow(rowId);
        setExpandTimers((prev) => {
          const next = new Map(prev);
          next.delete(rowId);
          return next;
        });
      }, autoExpandOnHoverMs);

      setExpandTimers((prev) => {
        const next = new Map(prev);
        next.set(rowId, timer);
        return next;
      });
    },
    [autoExpandOnHoverMs, clearExpandTimer, expandRow],
  );

  const onDragStart = useCallback(
    (_event: DragStartEvent) => {
      // Clear all expand timers when starting a drag
      expandTimers.forEach((timer) => clearTimeout(timer));
      setExpandTimers(new Map());
    },
    [expandTimers],
  );

  const onDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeType = active.data.current?.type;
      const overType = over.data.current?.type;
      if (!activeType || !overType) return;

      // Handle auto-expand for collapsed rows when item hovers
      if (activeType === 'item' && overType === 'row') {
        const rowIndex = findRow(over.id.toString());
        const row = currentRows[rowIndex];
        if (row && row.collapsed !== false) {
          // collapsed or undefined (uncontrolled)
          setExpandTimer(row.id);
        }
      } else {
        // Clear timers when not hovering over a row
        expandTimers.forEach((timer) => clearTimeout(timer));
        setExpandTimers(new Map());
      }

      // Row to row
      if (activeType === 'row' && overType === 'row') {
        const srcIndex = findRow(active.id.toString());
        const destIndex = findRow(over.id.toString());
        if (srcIndex === -1 || destIndex === -1 || srcIndex === destIndex) return;

        const newRows = moveRow(currentRows, srcIndex, destIndex);
        updateRows(newRows);
        return;
      }

      // Item to item/row
      if (activeType === 'item') {
        const srcPos = findItem(active.id.toString());
        if (!srcPos) return;

        const destPos =
          overType === 'item'
            ? findItem(over.id.toString())
            : (() => {
                const idx = findRow(over.id.toString());
                return idx !== -1 ? { rowIndex: idx, itemIndex: 0 } : null;
              })();

        if (!destPos) return;
        if (srcPos.rowIndex === destPos.rowIndex && srcPos.itemIndex === destPos.itemIndex) return;

        const newRows = moveItem(currentRows, srcPos, destPos);
        updateRows(newRows);
      }
    },
    [findRow, findItem, currentRows, updateRows, setExpandTimer, expandTimers],
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      // Clear all expand timers
      expandTimers.forEach((timer) => clearTimeout(timer));
      setExpandTimers(new Map());

      const over = event.over;
      const active = event.active;
      if (!over || !active) return;

      const overType = over.data.current?.type;
      const activeType = active.data.current?.type;
      if (!overType || !activeType) return;

      if (overType === 'row' && activeType === 'row') {
        const srcIndex = findRow(active.id.toString());
        const destIndex = findRow(over.id.toString());
        if (srcIndex === -1 || destIndex === -1) return;

        const moveEvt: RowMoveEvent = {
          type: 'row',
          dest: { rowIndex: destIndex },
          source: { rowIndex: srcIndex },
        };
        const row = currentRows[srcIndex];
        if (row?.onMove) {
          row.onMove(moveEvt, getMoveRelativePosition(currentRows, moveEvt));
        }
      } else if ((overType === 'item' || overType === 'row') && activeType === 'item') {
        const srcPos = findItem(active.id.toString());
        if (!srcPos) return;

        const destPos =
          overType === 'item'
            ? findItem(over.id.toString())
            : (() => {
                const idx = findRow(over.id.toString());
                return idx !== -1 ? { rowIndex: idx, itemIndex: 0 } : null;
              })();

        if (!destPos) return;

        const moveEvt: ItemMoveEvent = {
          type: 'item',
          dest: destPos,
          source: srcPos,
        };
        const item = currentRows[srcPos.rowIndex]?.items[srcPos.itemIndex];
        if (item?.onMove) {
          item.onMove(moveEvt, getMoveRelativePosition(currentRows, moveEvt));
        }
      }
    },
    [findRow, findItem, currentRows, expandTimers],
  );

  const announcements: Announcements = {
    onDragStart({ active }) {
      const activeType = active.data.current?.type;
      if (activeType === 'row') {
        const rowIndex = findRow(active.id.toString());
        const row = currentRows[rowIndex];
        return `Picked up row ${row?.label || active.id}`;
      } else if (activeType === 'item') {
        const itemPos = findItem(active.id.toString());
        const item = itemPos ? currentRows[itemPos.rowIndex]?.items[itemPos.itemIndex] : null;
        return `Picked up item ${item?.label || active.id}`;
      }
      return `Picked up draggable item ${active.id}`;
    },
    onDragOver({ active, over }) {
      if (!over) return;
      const activeType = active.data.current?.type;
      const overType = over.data.current?.type;

      if (activeType === 'row' && overType === 'row') {
        const overRow = currentRows[findRow(over.id.toString())];
        return `Row is over ${overRow?.label || over.id}`;
      } else if (activeType === 'item') {
        if (overType === 'item') {
          const overPos = findItem(over.id.toString());
          const overItem = overPos ? currentRows[overPos.rowIndex]?.items[overPos.itemIndex] : null;
          return `Item is over ${overItem?.label || over.id}`;
        } else if (overType === 'row') {
          const overRow = currentRows[findRow(over.id.toString())];
          const isCollapsed = overRow?.collapsed !== false;
          return `Item is over ${isCollapsed ? 'collapsed ' : ''}row ${overRow?.label || over.id}${
            isCollapsed && autoExpandOnHoverMs > 0 ? ', will expand automatically' : ''
          }`;
        }
      }
      return '';
    },
    onDragEnd({ active, over }) {
      if (!over) return `${active.id} was dropped`;
      const activeType = active.data.current?.type;
      const overType = over.data.current?.type;

      if (activeType === 'row' && overType === 'row') {
        const overRow = currentRows[findRow(over.id.toString())];
        return `Row was dropped over ${overRow?.label || over.id}`;
      } else if (activeType === 'item') {
        if (overType === 'item') {
          const overPos = findItem(over.id.toString());
          const overItem = overPos ? currentRows[overPos.rowIndex]?.items[overPos.itemIndex] : null;
          return `Item was dropped over ${overItem?.label || over.id}`;
        } else if (overType === 'row') {
          const overRow = currentRows[findRow(over.id.toString())];
          return `Item was dropped in row ${overRow?.label || over.id}`;
        }
      }
      return `${active.id} was dropped`;
    },
    onDragCancel({ active }) {
      return `${active.id} was dropped`;
    },
  };

  return {
    sensors,
    onDragStart,
    onDragEnd,
    onDragOver,
    rows: currentRows,
    announcements,
  };
};

const ScrumItem = React.memo((props: ScrumItemProps & { rowId: string }) => {
  const { id, rowId, label, renderLabel } = props;
  const dndContext = useDndContext();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { type: 'item', rowId },
  });

  // const isActive = dndContext.active?.id === id;
  const isKeyboardDragging =
    dndContext.active?.id === id && dndContext.activatorEvent?.type === 'keydown';

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const labelNode = renderLabel?.(props, { attributes, listeners }) || label;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!renderLabel && { ...listeners, ...attributes })}
      role='listitem'
      aria-label={`Item: ${label}`}
      className={cn(
        !renderLabel && 'touch-none cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-20 pointer-events-none',
        isKeyboardDragging && 'ring-2 ring-blue-500 ring-offset-1',
      )}
    >
      {labelNode}
    </div>
  );
});

ScrumItem.displayName = 'ScrumItem';

const ScrumRow = React.memo((props: ScrumRowProps) => {
  const { id, label, items, renderRowHeader, onCollapsedChange } = props;
  const dndContext = useDndContext();
  const { collapsed, toggle } = useCollapsed(id, props.collapsed, onCollapsedChange);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { type: 'row', rowId: id },
  });

  // Separate droppable for the row when collapsed
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `${id}-drop`,
    data: { type: 'row', rowId: id },
    disabled: !collapsed,
  });

  // const isActive = dndContext.active?.id === id;
  const activeType = dndContext.active?.data.current?.type;
  const isKeyboardDragging =
    dndContext.active?.id === id && dndContext.activatorEvent?.type === 'keydown';

  const style = { transition, transform: CSS.Transform.toString(transform) };
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);

  const handleToggleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggle();
    },
    [toggle],
  );

  const handleToggleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }
    },
    [toggle],
  );

  const defaultHeader = (
    <div className='flex items-center gap-2 mb-2'>
      <Button
        size='icon'
        type='button'
        variant='ghost'
        onClick={handleToggleClick}
        onKeyDown={handleToggleKeyDown}
        aria-expanded={!collapsed}
        aria-controls={`row-items-${id}`}
      >
        <ChevronRight className={cn('w-4 h-4 transition-transform', !collapsed && 'rotate-90')} />
      </Button>
      <div
        className='font-semibold text-lg cursor-grab active:cursor-grabbing flex-1'
        {...listeners}
        {...attributes}
      >
        {label}
      </div>
      <span className='text-sm text-gray-500'>
        {items.length} item{items.length !== 1 ? 's' : ''}
      </span>
    </div>
  );

  const headerNode = renderRowHeader
    ? renderRowHeader({
        row: props,
        dnd: { attributes, listeners },
        collapsed,
        toggle,
        itemCount: items.length,
      })
    : defaultHeader;

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setDropRef(node);
      }}
      style={style}
      role='region'
      aria-label={`Row: ${label}`}
      className={cn(
        isDragging && 'opacity-20 pointer-events-none',
        activeType === 'item' && collapsed && isOver && 'ring-2 ring-blue-400 rounded-lg',
        isKeyboardDragging && 'ring-2 ring-blue-500 ring-offset-2',
        'touch-none bg-gray-100 rounded-lg p-3',
      )}
    >
      {headerNode}

      <div
        ref={setDropRef}
        className={cn(
          'transition-all duration-200 overflow-hidden',
          collapsed && 'max-h-0 opacity-0',
          !collapsed && 'max-h-none opacity-100',
        )}
      >
        <SortableContext id={id} items={itemIds} strategy={verticalListSortingStrategy}>
          <div
            id={`row-items-${id}`}
            role='list'
            aria-label={`Items in ${label}`}
            className={cn(
              'flex flex-col justify-center gap-2',
              {
                'min-h-[40px] border-2 border-dashed border-gray-300 rounded-lg':
                  !collapsed && items.length === 0,
              },
              { 'mt-2': !collapsed },
            )}
          >
            {!collapsed && items.length === 0 ? (
              <div className='text-center text-gray-400 text-sm'>Drop items here</div>
            ) : (
              items.map((item) => <ScrumItem {...item} key={item.id} rowId={id} />)
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
});

ScrumRow.displayName = 'ScrumRow';

export const ScrumBoard = ({ className, ...props }: ScrumBoardProps) => {
  const { rows, sensors, onDragStart, onDragOver, onDragEnd, announcements } = useScrumBoard(props);
  const dndContext = useDndContext();
  const active = dndContext?.active;

  const rowIds = useMemo(() => rows.map((row) => row.id), [rows]);

  // Render active overlay based on type
  const renderDragOverlay = () => {
    if (!active) return null;

    const activeType = active.data.current?.type;

    if (activeType === 'row') {
      const rowIndex = rows.findIndex((row) => row.id === active.id);
      const row = rows[rowIndex];
      if (!row) return null;

      return (
        <div className={cn('shadow-xl bg-gray-100 rounded-lg p-3 cursor-grabbing opacity-95')}>
          <div className='font-semibold text-lg mb-2'>{row.label}</div>
          <div className='flex flex-col gap-2 max-h-40 overflow-hidden'>
            {row.items.slice(0, 3).map((item) => (
              <div key={item.id} className='rounded shadow bg-white p-2'>
                {item.label}
              </div>
            ))}
            {row.items.length > 3 && (
              <div className='text-gray-500 text-sm text-center'>
                +{row.items.length - 3} more items
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeType === 'item') {
      // Find the item across all rows
      let activeItem = null;
      for (const row of rows) {
        const item = row.items.find((item) => item.id === active.id);
        if (item) {
          activeItem = item;
          break;
        }
      }

      if (!activeItem) return null;

      return (
        <div className='shadow-xl rounded bg-white p-2 cursor-grabbing opacity-95'>
          {activeItem.label}
        </div>
      );
    }

    return null;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      accessibility={{ announcements }}
    >
      <SortableContext items={rowIds} strategy={rectSortingStrategy}>
        <div
          className={cn('flex flex-col space-y-4 overflow-y-auto h-full', className)}
          role='application'
          aria-label='Scrum board with draggable rows and items'
        >
          {rows.map((row) => (
            <ScrumRow key={row.id} {...row} />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>{renderDragOverlay()}</DragOverlay>
    </DndContext>
  );
};
