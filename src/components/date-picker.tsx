import React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  dateFormat?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  contentClassName?: string;
  align?: 'start' | 'center' | 'end';
  'aria-label'?: string;
  allowClear?: boolean;
  showWeekNumbers?: boolean;
  isDateDisabled?: (date: Date) => boolean;
  showPlaceholder?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  minDate,
  maxDate,
  dateFormat = 'MMM dd, yyyy',
  variant = 'outline',
  size = 'default',
  className,
  contentClassName,
  align = 'start',
  'aria-label': ariaLabel,
  allowClear = true,
  showWeekNumbers = false,
  isDateDisabled,
  showPlaceholder = true,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleDateSelect = React.useCallback(
    (selectedDate: Date | undefined) => {
      if (!selectedDate) {
        onChange?.(null);
        setIsOpen(false);
        return;
      }

      if (allowClear && value) {
        const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
        const currentDateString = format(value, 'yyyy-MM-dd');

        if (selectedDateString === currentDateString) {
          onChange?.(null);
          setIsOpen(false);
          return;
        }
      }

      onChange?.(selectedDate);
      setIsOpen(false);
    },
    [onChange, value, allowClear],
  );

  const isDateDisabledInternal = React.useCallback(
    (date: Date) => {
      // Check min/max dates
      if (minDate && date < minDate) return true;
      if (maxDate && date > maxDate) return true;

      // Check custom disabled logic
      if (isDateDisabled) return isDateDisabled(date);

      return false;
    },
    [minDate, maxDate, isDateDisabled],
  );

  const sizeClasses = { default: 'h-10', sm: 'h-8 text-xs', lg: 'h-12 text-base' };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant={variant}
          size={size}
          className={cn(
            'justify-start text-left font-normal',
            sizeClasses[size],
            !value && 'text-muted-foreground',
            className,
          )}
          disabled={disabled}
          aria-label={
            ariaLabel || `Select date. Current value: ${value ? format(value, dateFormat) : 'None'}`
          }
          aria-expanded={isOpen}
          aria-haspopup='dialog'
        >
          {value ? format(value, dateFormat) : <span hidden={!showPlaceholder}>{placeholder}</span>}
          <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className={cn('w-auto p-0', contentClassName)}
        align={align}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Calendar
          mode='single'
          selected={value || undefined}
          onSelect={handleDateSelect}
          disabled={isDateDisabledInternal}
          showWeekNumber={showWeekNumbers}
          initialFocus
          className='rounded-md border'
        />
      </PopoverContent>
    </Popover>
  );
};
