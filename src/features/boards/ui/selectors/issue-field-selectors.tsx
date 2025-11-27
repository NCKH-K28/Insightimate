import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export const fieldToOption = (field: IssueField): IssueFieldOption => ({
  value: field.id,
  label: field.name,
  icon: field.iconURL ? (
    <Image
      src={field.iconURL}
      alt={field.name}
      width={16}
      height={16}
      className='h-4 w-4 rounded'
    />
  ) : undefined,
  searchValue: `${field.name} ${field.description || ''}`,
});

type IssueField = {
  id: string;
  name: string;
  sequence?: number;
  description?: string | null;
  iconURL?: string | null;
  color?: string | null;
};

export type IssueFieldOption = {
  value: string | null;
  label: string;
  icon?: React.ReactNode;
  searchValue?: string;
};

type IssueFieldSelectorsProps = {
  value?: IssueFieldOption | null;
  defaultValue?: IssueFieldOption | null;
  onChange?: (value: IssueFieldOption) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  variant?: 'outline' | 'ghost' | 'link' | 'default';
  renderTrigger?: (option: IssueFieldOption | null) => React.ReactNode;
  excludeIds?: (string | null)[];
  extends?: IssueFieldOption[];
  fetchQueryOptions?: () => UseQueryOptions<any, any, IssueField[], any>;
  onFetched?: (fields: IssueField[]) => void;
  queryKey?: string[];
  className?: string;
  popoverClassName?: string;

  label?: string;
  triggerOptions?: { showIcon?: boolean; showLabel?: boolean; className?: string };
  selectOptions?: { showIcon?: boolean; showLabel?: boolean };
};

export const IssueFieldSelectors = ({
  value,
  defaultValue,
  onChange,
  disabled,
  placeholder = 'Select field...',
  searchPlaceholder = 'Search fields...',
  emptyMessage = 'No field found.',
  variant = 'outline',
  renderTrigger,
  excludeIds = [],
  extends: extendsOptions = [],
  fetchQueryOptions,
  onFetched,
  className,
  popoverClassName,
  label,
  triggerOptions: _triggerOptions,
  selectOptions: _selectOptions,
}: IssueFieldSelectorsProps) => {
  const triggerOptions = useMemo(
    () => ({ showIcon: true, showLabel: true, ..._triggerOptions }),
    [_triggerOptions],
  );
  const selectOptions = useMemo(
    () => ({ showIcon: true, showLabel: true, ..._selectOptions }),
    [_selectOptions],
  );

  const { data: fields, isPending: isLoading } = useQuery({
    queryKey: '___internal__issue_fields',
    queryFn: async (): Promise<IssueField[]> => [],
    ...fetchQueryOptions?.(),
  });

  useEffect(() => {
    if (fields) onFetched?.(fields);
  }, [fields, onFetched]);

  const options: IssueFieldOption[] = useMemo(
    () => (fields ? fields.map(fieldToOption) : []),
    [fields],
  );

  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds]);
  const filteredOptions = useMemo(
    () => [...extendsOptions, ...options].filter((option) => !excludeSet.has(option.value)),
    [options, excludeSet, extendsOptions],
  );

  // Internal state management
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const uncontrolled = useMemo(() => !value && !!defaultValue, [value, defaultValue]);
  const [internal, setInternal] = React.useState<IssueFieldOption | null>(() =>
    uncontrolled ? defaultValue || null : null,
  );
  const selected = uncontrolled ? internal : value || null;

  const commit = (next: IssueFieldOption) => {
    if (uncontrolled) setInternal(next);
    onChange?.(next);
  };

  const TriggerElm = renderTrigger ? renderTrigger(selected) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
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
          {TriggerElm ? (
            TriggerElm
          ) : (
            <span className={cn('truncate', !selected && 'text-muted-foreground')}>
              {selected ? (
                <div className='flex items-center gap-2'>
                  {triggerOptions.showIcon && selected.icon}
                  {triggerOptions.showLabel && <span>{selected.label}</span>}
                </div>
              ) : (
                placeholder
              )}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('w-40 p-0 z-50', popoverClassName)} align='start'>
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={(text) => setSearch(text)}
            autoFocus
          />
          <CommandList>
            <CommandEmpty>{isLoading ? 'Loading...' : emptyMessage}</CommandEmpty>

            {!isLoading && (
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.searchValue || option.value || undefined}
                    onSelect={() => {
                      commit(option);
                      setOpen(false);
                      setSearch('');
                    }}
                    className='cursor-pointer'
                  >
                    {selectOptions.showIcon && option.icon && (
                      <span className='mr-2'>{option.icon}</span>
                    )}
                    {selectOptions.showLabel && <span>{option.label}</span>}
                    {selected?.value === option.value && <CheckIcon className='ml-auto h-4 w-4' />}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
