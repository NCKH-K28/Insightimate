import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type DateOption = { label: string; value: Date | null };
type IssueDateSelectorsProps = {
  value: DateOption | null;
  defaultValue?: DateOption | null;
  onChange?: (date: DateOption | null) => void;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  variant?: 'outline' | 'ghost' | 'link' | 'default';
  renderTrigger?: (date: DateOption | null) => React.ReactNode;
  className?: string;
  popoverClassName?: string;
};

export const IssueDateSelectors = ({
  value,
  defaultValue,
  onChange,
  disabled,
  placeholder = 'Select date...',
  label,
  variant = 'outline',
  renderTrigger,
  className,
  popoverClassName,
}: IssueDateSelectorsProps) => {
  const [open, setOpen] = React.useState(false);

  const uncontrolled = React.useMemo(() => !value && !!defaultValue, [value, defaultValue]);

  const [internal, setInternal] = React.useState<DateOption | null>(() =>
    uncontrolled ? defaultValue || null : null,
  );
  const selected = uncontrolled ? internal : value || null;

  const commit = (next: DateOption | null) => {
    if (uncontrolled) setInternal(next);
    onChange?.(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className='truncate'>
        {renderTrigger ? (
          renderTrigger(value)
        ) : (
          <Button
            type='button'
            variant={variant}
            role='combobox'
            aria-expanded={open}
            aria-label={label ?? placeholder}
            disabled={disabled}
            className={cn(
              'w-full justify-between',
              !selected && 'text-muted-foreground',
              disabled && 'cursor-not-allowed',
              className,
            )}
            size='sm'
          >
            {value ? value.label : placeholder}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className={popoverClassName}>
        <Calendar
          mode='single'
          selected={selected && selected.value ? new Date(selected.value) : undefined}
          captionLayout='dropdown'
          onSelect={(date) => {
            commit(date ? { label: date.toISOString(), value: date } : null);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
