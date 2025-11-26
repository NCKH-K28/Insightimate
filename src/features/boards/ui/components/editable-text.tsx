'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check, X, Pencil } from 'lucide-react';

interface EditableTextProps {
  value: string;
  onSave: (value: string) => Promise<void> | void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  maxLength?: number;
  required?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  disable?: boolean;
}

export default function EditableText({
  value,
  onSave,
  placeholder = 'Click to edit...',
  className,
  inputClassName,
  maxLength = 255,
  required = false,
  as: Tag = 'span',
  disable = false,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync với value từ props
  useEffect(() => {
    if (!isEditing) {
      setText(value);
    }
  }, [value, isEditing]);

  // Auto focus khi vào edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmed = text.trim();

    // Validate
    if (required && !trimmed) {
      setText(value);
      setIsEditing(false);
      return;
    }

    // Không thay đổi
    if (trimmed === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(trimmed);
      setIsEditing(false);
    } catch {
      setText(value); // Rollback
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setText(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className='flex items-center gap-2'>
        <Input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isSaving || disable}
          maxLength={maxLength}
          placeholder={placeholder}
          className={cn('flex-1', inputClassName)}
        />
        <button
          type='button'
          onClick={handleSave}
          disabled={isSaving}
          className='p-1.5 rounded-md hover:bg-accent text-green-600 hover:text-green-700 transition-colors'
          aria-label='Save'
        >
          <Check className='h-4 w-4' />
        </button>
        <button
          type='button'
          onClick={handleCancel}
          disabled={isSaving}
          className='p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors'
          aria-label='Cancel'
        >
          <X className='h-4 w-4' />
        </button>
      </div>
    );
  }

  return (
    <Tag
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => e.key === 'Enter' && setIsEditing(true)}
      tabIndex={0}
      role='button'
      className={cn(
        'cursor-text inline-flex items-center gap-2 group',
        'rounded-md px-2 py-1 -mx-2',
        'hover:bg-accent/50 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-ring',
        className,
      )}
    >
      {value || <span className='text-muted-foreground italic'>{placeholder}</span>}
      <Pencil className='h-3.5 w-3.5 opacity-0 group-hover:opacity-50 transition-opacity cursor-pointer' />
    </Tag>
  );
}
