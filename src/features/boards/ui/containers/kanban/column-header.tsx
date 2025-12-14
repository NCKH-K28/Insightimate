'use client';

import { useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Column } from './types';

interface ColumnHeaderProps {
  column: Column;
  cardCount: number;
  onTitleChange: (columnId: string, newTitle: string) => void;
  onDelete: (columnId: string) => void;
}

export function ColumnHeader({ column, cardCount, onTitleChange, onDelete }: ColumnHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(column.title);

  const handleSave = () => {
    if (editValue.trim()) {
      onTitleChange(column.id, editValue.trim());
    } else {
      setEditValue(column.title);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(column.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className='flex items-center justify-between gap-2 mb-3 px-1'>
      {isEditing ? (
        <div className='flex items-center gap-1 flex-1'>
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className='h-8 text-sm font-semibold'
            autoFocus
          />
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7 shrink-0'
            onClick={handleSave}
            aria-label='Save'
          >
            <Check className='h-4 w-4 text-green-600' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7 shrink-0'
            onClick={handleCancel}
            aria-label='Cancel'
          >
            <X className='h-4 w-4 text-red-600' />
          </Button>
        </div>
      ) : (
        <>
          <div className='flex items-center gap-2 flex-1 min-w-0'>
            <h3 className='font-semibold text-sm truncate'>{column.title}</h3>
            <span className='text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0'>
              {cardCount}
            </span>
          </div>

          <div className='flex gap-1 shrink-0'>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7'
              onClick={() => setIsEditing(true)}
              aria-label='Edit column title'
            >
              <Pencil className='h-3. 5 w-3.5' />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7 text-destructive hover:text-destructive'
                  aria-label='Delete column'
                >
                  <Trash2 className='h-3.5 w-3.5' />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete column? </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete the column &quot;{column.title}&quot; and all its cards. This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(column.id)}
                    className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </>
      )}
    </div>
  );
}
