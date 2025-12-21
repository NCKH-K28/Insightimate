import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { colDndId, colEndDndId, Column, ColumnItem, itemDndId } from './ui';
import clamp from 'lodash/clamp';
import React, { useMemo } from 'react';
import { IssueCard } from './issue-card';
import { MoreHorizontal, Plus, Settings, Trash2, GripHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

function Placeholder() {
  return <div className='h-2 w-full bg-slate-200' />;
}

function ColumnEndZone({ columnId }: { columnId: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: colEndDndId(columnId) });
  return (
    <div
      ref={setNodeRef}
      style={{
        height: 28,
        borderRadius: 8,
        marginTop: 4,
        background: isOver ? 'rgba(0,0,0,0.06)' : 'transparent',
      }}
    />
  );
}

function SortableCard({
  item,
  onRemove,
  onEdit,
}: {
  item: ColumnItem;
  onRemove?: () => void;
  onEdit?: () => void;
}) {
  const dndId = itemDndId(item.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: dndId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <IssueCard
        item={item}
        isDragging={isDragging}
        dragProps={{ ...attributes, ...listeners }}
        onRemove={onRemove}
        onEdit={onEdit}
      />
    </div>
  );
}

export type BoardColumnProps = {
  column: Column;
  activeItemId: string | null;
  overColumnId: string | null;
  overIndex: number | null;
  onRemoveItem?: (columnId: string, itemId: string) => void;
  onRemoveColumn?: (columnId: string) => void;
  onEditColumn?: (col: Column) => void;
  onAddItem?: (colId: string) => void;
  onEditItem?: (item: ColumnItem) => void;
};

export function BoardColumn({
  column,
  activeItemId,
  overColumnId,
  overIndex,
  onAddItem,
  onRemoveItem,
  onRemoveColumn,
  onEditColumn,
  onEditItem,
}: BoardColumnProps) {
  // Use useSortable for the column drag-and-drop
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging: isColumnDragging,
  } = useSortable({
    id: colDndId(column.id),
    data: {
      type: 'Column',
      column,
    },
  });

  const style = {
    // We use Translate to avoid distorting layout properties like width
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const ids = useMemo(() => column.items.map((it) => itemDndId(it.id)), [column.items]);

  // Visual placeholder logic for items
  const showPlaceholder = !!activeItemId && overColumnId === column.id && overIndex !== null;
  const insertAt = showPlaceholder ? clamp(overIndex!, 0, column.items.length) : -1;

  const items = column.items;
  const totalPoints = useMemo(() => {
    return items.reduce((sum, i) => sum + (i.data.storyPoints || 0), 0);
  }, [items]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'shrink-0 w-72 bg-slate-50 rounded-lg transition-colors duration-200 flex flex-col',
        isColumnDragging && 'opacity-50 ring-2 ring-primary ring-offset-2',
      )}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className='p-3 flex flex-col gap-2 h-full'>
          {/* Header */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              {/* Drag Handle */}
              <div
                {...attributes}
                {...listeners}
                className='cursor-grab hover:bg-slate-200 p-1 rounded transition-colors touch-none'
              >
                <GripHorizontal className='h-4 w-4 text-slate-400' />
              </div>

              <h3 className='font-semibold text-sm text-slate-700'>{column.data.name}</h3>
              <Badge variant='secondary' className={cn('text-xs')}>
                {items.length}
              </Badge>
            </div>

            <div className='flex items-center gap-1'>
              <Button
                variant='ghost'
                size='icon'
                className='h-6 w-6'
                onClick={() => onAddItem?.(column.id)}
              >
                <Plus className='h-4 w-4 text-muted-foreground' />
              </Button>
              <span className='text-xs text-muted-foreground'>{totalPoints} pts</span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='icon' className='h-6 w-6'>
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={() => onEditColumn?.(column)}>
                    <Settings className='h-4 w-4 mr-2' />
                    Column settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onRemoveColumn?.(column.id)}
                    className='text-destructive focus:text-destructive'
                  >
                    <Trash2 className='h-4 w-4 mr-2' />
                    Delete column
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <ScrollArea className='flex-1 max-h-[calc(100vh-200px)] overflow-y-auto'>
            {column.items.map((item, idx) => (
              <React.Fragment key={item.id}>
                {showPlaceholder && idx === insertAt ? <Placeholder /> : null}
                <SortableCard
                  item={item}
                  onRemove={() => onRemoveItem?.(column.id, item.id)}
                  onEdit={() => onEditItem?.(item)}
                />
              </React.Fragment>
            ))}
            {/* End zone allows dropping at the end of the list */}
            <ColumnEndZone columnId={column.id} />
          </ScrollArea>
        </div>
      </SortableContext>
    </div>
  );
}
