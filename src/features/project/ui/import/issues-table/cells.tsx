'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FieldPathByValue, useController, useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormValues, Option } from './types';

type Nullish = null | undefined;
type SelectName = FieldPathByValue<FormValues, Option['value'] | Nullish>;
type InputName = FieldPathByValue<FormValues, string | number | Nullish>;

export type RHFSelectCellProps = {
  name: SelectName;
  options: Option[];
  nullable?: boolean;
  className?: string;
};
import * as React from 'react';
import { X } from 'lucide-react';

export function RHFSelectCell({ name, options, className, nullable = false }: RHFSelectCellProps) {
  const { control } = useFormContext<FormValues>();
  const { field, fieldState } = useController({ control, name });

  const uiValue = String(field.value ?? '');

  const selected = React.useMemo(
    () => options.find((opt) => String(opt.value) === uiValue),
    [options, uiValue],
  );

  const clear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    field.onChange('', { shouldValidate: true });
  };

  return (
    <Select
      value={uiValue}
      onValueChange={(v) => field.onChange(v, { shouldValidate: true })}
      disabled={field.disabled}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div className='relative'>
            <SelectTrigger
              onBlur={field.onBlur}
              className={cn(
                'relative w-32',
                fieldState.error && 'border-destructive',
                nullable && uiValue !== '' && '[&>svg]:hidden',
                className,
              )}
              style={{
                borderLeft: selected?.color ? `4px solid ${selected.color}` : undefined,
              }}
            >
              <SelectValue placeholder='Select value' />
            </SelectTrigger>
            {nullable && uiValue !== '' && !field.disabled && (
              <button
                type='button'
                onMouseDown={(e) => e.preventDefault()}
                onClick={clear}
                className='z-10 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                aria-label='Clear'
              >
                <X className='h-4 w-4' />
              </button>
            )}
          </div>
        </TooltipTrigger>

        {fieldState.error && <TooltipContent>{fieldState.error.message}</TooltipContent>}
      </Tooltip>

      <SelectContent>
        {options.map((opt) => (
          <SelectItem
            key={String(opt.value)}
            value={String(opt.value)}
            style={{ borderLeft: opt.color ? `4px solid ${opt.color}` : undefined }}
          >
            {opt.label ?? String(opt.value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export type RHFInputCellProps = {
  name: InputName;
  type?: 'text' | 'number';
  className?: string;
};
export function RHFInputCell({ name, type, className }: RHFInputCellProps) {
  const { control } = useFormContext<FormValues>();
  const { field, fieldState } = useController({ control, name });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Input
          {...field}
          value={field.value ?? ''}
          type={type}
          className={cn(fieldState.error && 'border-destructive', className)}
        />
      </TooltipTrigger>
      <TooltipContent hidden={!fieldState.error}>
        {fieldState.error ? fieldState.error.message : 'Edit value'}
      </TooltipContent>
    </Tooltip>
  );
}
