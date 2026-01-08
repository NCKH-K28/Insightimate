'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
  onChange,
  onBlur,
  className,
  disabled = false,
  min = 0,
  max,
  step = 0.1,
  placeholder = '-',
  ...props
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const uncontrolled = useMemo(() => props.value === undefined, [props.value]);
  const [internalV, setInternalV] = useState<number | null>(defaultValue);

  const value = useMemo(() => {
    return uncontrolled ? internalV : props.value;
  }, [uncontrolled, internalV, props.value]);

  const setValue = useCallback(
    (val: number | null) => {
      if (uncontrolled) setInternalV(val);
      else onChange?.(val);
    },
    [uncontrolled, onChange],
  );

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
    setInputValue(value?.toString() ?? '');
  }, [disabled, value]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      setInputValue(rawValue);

      // Real-time validation and onChange
      const validatedValue = validateAndParseValue(rawValue);
      setValue(validatedValue);
    },
    [validateAndParseValue, setValue],
  );

  const handleFinishEditing = useCallback(
    (shouldCommit = true) => {
      setIsEditing(false);

      if (shouldCommit) {
        const finalValue = validateAndParseValue(inputValue);
        setValue(finalValue);
        onBlur?.(finalValue);
      } else {
        setInputValue(value?.toString() ?? '');
      }
    },
    [inputValue, validateAndParseValue, setValue, onBlur, value],
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
            setValue(validatedValue);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (inputRef.current) {
            const currentNum = parseFloat(inputRef.current.value) || 0;
            const newValue = Math.max(min, currentNum - step);
            const validatedValue = validateAndParseValue(newValue.toString());
            setInputValue(validatedValue?.toString() ?? '');
            setValue(validatedValue);
          }
          break;
      }
    },
    [handleFinishEditing, step, min, validateAndParseValue, setValue],
  );

  // Auto-focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const displayValue = value?.toString() ?? placeholder;
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
