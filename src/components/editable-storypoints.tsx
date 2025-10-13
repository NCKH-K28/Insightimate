'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils'; // assuming you have a cn utility function

export interface EditableStorypointsProps {
  defaultValue?: number | null;
  value?: number | null;
  onChange?: (value: number | null) => void;
  onBlur?: (value: number | null) => void;
  className?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export const EditableStorypoints: React.FC<EditableStorypointsProps> = ({
  defaultValue = null,
  value,
  onChange,
  onBlur,
  className,
  disabled = false,
  min = 0,
  max,
  step = 0.1,
  placeholder = '-',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine if component is controlled or uncontrolled
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<number | null>(defaultValue);

  const currentValue = isControlled ? value : internalValue;

  const validateAndParseValue = useCallback(
    (input: string): number | null => {
      if (input === '' || input === null || input === undefined) return null;

      const num = parseFloat(input);
      if (isNaN(num)) return null;

      let validatedNum = Math.max(min, num);
      if (max !== undefined) {
        validatedNum = Math.min(max, validatedNum);
      }

      return validatedNum;
    },
    [min, max],
  );

  const handleEdit = useCallback(() => {
    if (disabled) return;

    setIsEditing(true);
    setInputValue(currentValue?.toString() ?? '');
  }, [disabled, currentValue]);

  const commitValue = useCallback(
    (newValue: number | null) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    },
    [isControlled, onChange],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      setInputValue(rawValue);

      // Real-time validation and onChange
      const validatedValue = validateAndParseValue(rawValue);
      commitValue(validatedValue);
    },
    [validateAndParseValue, commitValue],
  );

  const handleFinishEditing = useCallback(
    (shouldCommit = true) => {
      setIsEditing(false);

      if (shouldCommit) {
        const finalValue = validateAndParseValue(inputValue);
        commitValue(finalValue);
        onBlur?.(finalValue);
      } else {
        // Reset to current value on escape
        setInputValue(currentValue?.toString() ?? '');
      }
    },
    [inputValue, validateAndParseValue, commitValue, onBlur, currentValue],
  );

  const handleInputBlur = useCallback(() => {
    handleFinishEditing(true);
  }, [handleFinishEditing]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          handleFinishEditing(true);
          break;
        case 'Escape':
          e.preventDefault();
          handleFinishEditing(false);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (inputRef.current) {
            const currentNum = parseFloat(inputRef.current.value) || 0;
            const newValue = currentNum + step;
            const validatedValue = validateAndParseValue(newValue.toString());
            setInputValue(validatedValue?.toString() ?? '');
            commitValue(validatedValue);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (inputRef.current) {
            const currentNum = parseFloat(inputRef.current.value) || 0;
            const newValue = Math.max(min, currentNum - step);
            const validatedValue = validateAndParseValue(newValue.toString());
            setInputValue(validatedValue?.toString() ?? '');
            commitValue(validatedValue);
          }
          break;
      }
    },
    [handleFinishEditing, step, min, validateAndParseValue, commitValue],
  );

  // Auto-focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync with external value changes
  useEffect(() => {
    if (isControlled && !isEditing) {
      setInternalValue(value);
    }
  }, [value, isControlled, isEditing]);

  const displayValue = currentValue ?? placeholder;
  const badgeClasses = cn(
    'min-h-6 min-w-8 cursor-pointer transition-colors',
    'hover:bg-accent hover:text-accent-foreground',
    {
      'cursor-not-allowed opacity-50': disabled,
      'cursor-pointer': !disabled,
    },
    className,
  );

  const inputClasses = cn('min-h-6 min-w-8 w-16 text-center', className);

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        aria-label='Story points input'
        className={inputClasses}
        type='number'
        min={min}
        max={max}
        step={step}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        disabled={disabled}
      />
    );
  }

  return (
    <Badge
      aria-label={`Edit story points. Current value: ${displayValue}`}
      className={badgeClasses}
      onClick={handleEdit}
      role='button'
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleEdit();
        }
      }}
    >
      {displayValue}
    </Badge>
  );
};
