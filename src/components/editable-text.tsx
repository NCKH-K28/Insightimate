import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type EditableTextProps = {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
};

export const EditableText: React.FC<EditableTextProps> = ({
  value: controlledValue,
  defaultValue = '',
  onChange,
  onBlur,
  className,
  placeholder = 'Click to edit...',
  disabled = false,
  required = false,
}) => {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const value = isControlled ? controlledValue : internalValue;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(9999, 9999);
    }
  }, [isEditing]);

  const finish = () => {
    const trimmed = inputRef.current?.value.trim() || '';
    if (required && !trimmed) {
      inputRef.current!.value = value;
    } else {
      if (!isControlled) setInternalValue(trimmed);
      onBlur?.(trimmed);
    }
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <span
        className={cn(
          'min-h-6 px-2 py-1 rounded cursor-pointer hover:bg-secondary/50',
          !value && 'text-muted-foreground italic',
          disabled && 'cursor-not-allowed opacity-60',
          className,
        )}
        onClick={() => !disabled && setIsEditing(true)}
      >
        {value || placeholder}
      </span>
    );
  }

  return (
    <Input
      ref={inputRef}
      defaultValue={value}
      onBlur={finish}
      onChange={(e) => {
        if (!isControlled) setInternalValue(e.target.value);
        onChange?.(e.target.value);
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') finish();
        if (e.key === 'Escape') {
          inputRef.current!.value = value;
          setIsEditing(false);
        }
      }}
      className={cn('min-h-6', className)}
      disabled={disabled}
    />
  );
};
