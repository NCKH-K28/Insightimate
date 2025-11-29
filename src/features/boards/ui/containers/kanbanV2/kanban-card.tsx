'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EllipsisVertical, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { Card as CardUI, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Card } from './types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const BoardIssueActions = (props: {
  onDelete?: () => void;
  disabled?: boolean;
  className?: string;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={props.disabled} className={props.className}>
        <Button variant='outline' size='icon'>
          <EllipsisVertical />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={props?.onDelete}>
            <Trash2 className='mr-2' />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface KanbanCardProps {
  card: Card;
  onEdit: (card: Card) => void;
  onDelete: (cardId: string) => void;
}

export function KanbanCard({ card, onEdit, onDelete }: KanbanCardProps) {
  // Setup sortable functionality for drag & drop
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <CardUI
      ref={setNodeRef}
      style={style}
      className={cn('p-2 gap-2', 'rounded-lg', isDragging && 'ring-2 ring-primary')}
    >
      <CardHeader className='p-1'>
        <div className={cn('flex items-start justify-between gap-2')}>
          {/* Drag handle */}
          <div {...attributes} {...listeners} className='cursor-grab hover:bg-muted rounded'>
            <Button variant='ghost' size='icon' className='size-6'>
              <GripVertical className='h-4 w-4 text-muted-foreground' />
            </Button>
          </div>

          <div className='flex-1 min-w-0 flex flex-col gap-1 cursor-pointer'>
            <span className='font-medium text-sm wrap-break-word overflow-hidden line-clamp-2'>
              {card.title}
            </span>
          </div>

          <BoardIssueActions className='size-6' />
        </div>
      </CardHeader>

      <CardContent className='p-2 overflow-hidden'>
        {card.description && (
          <p className='text-xs text-muted-foreground line-clamp-2'>{card.description}</p>
        )}
        {!card.description && (
          <p className='text-xs text-muted-foreground italic line-clamp-2'>No description</p>
        )}
      </CardContent>

      <CardFooter>{/*  */}</CardFooter>
    </CardUI>
  );
}
