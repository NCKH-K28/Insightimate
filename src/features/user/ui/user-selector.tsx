import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
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
import { CheckIcon, UserMinus2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type User = {
  id: string;
  name: string;
  avatar?: string | null;
  email?: string | null;
};

export const unassignedUser = () => {
  return { value: null, label: 'Unassigned', icon: <UserMinus2 className='h-4 w-4' /> };
};

export const userToOption = (u: User): UserOption => {
  const label = u.email ? (
    <div className='flex flex-col'>
      <span>{u.name}</span>
      {/* <span className='text-xs text-muted-foreground'>{u.email}</span> */}
    </div>
  ) : (
    u.name
  );
  const icon = u.avatar ? (
    <Image src={u.avatar} alt={u.name} width={16} height={16} className='h-4 w-4 rounded' />
  ) : undefined;

  const searchValue = `${u.id} ${u.name}` + (u.email ? ` ${u.email}` : '');
  return { value: u.id, label, icon, searchValue };
};

export const isUserOption = (obj: any): obj is UserOption => {
  return obj && typeof obj === 'object' && 'value' in obj && 'label' in obj;
};

type UserOption = {
  value: string | null;
  label: string | React.ReactNode;
  icon?: React.ReactNode;
  searchValue?: string;
};

type UserSelectorsProps = {
  value?: UserOption | null;
  defaultValue?: UserOption | null;
  onChange?: (value: UserOption | null) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  label?: string;
  variant?: 'outline' | 'ghost' | 'link' | 'default';
  renderTrigger?: (option: UserOption | null) => React.ReactNode;
  fetchQueryOptions?: (search?: string) => UseQueryOptions<any, any, (UserOption | User)[], any>;
  className?: string;
  popoverClassName?: string;

  excludeOptions?: (string | null)[];
  extendOptions?: UserOption[];
};

export const UserSelectors = ({
  value,
  defaultValue,
  onChange,
  disabled,
  placeholder = 'Select field...',
  searchPlaceholder = 'Search fields...',
  emptyMessage = 'No field found.',
  label,
  variant = 'outline',
  renderTrigger,
  excludeOptions = [],
  extendOptions = [],
  fetchQueryOptions,
  className,
  popoverClassName,
}: UserSelectorsProps) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const uncontrolled = React.useMemo(() => !value && !!defaultValue, [value, defaultValue]);
  const [internal, setInternal] = React.useState<UserOption | null>(defaultValue || null);

  const selected = value ?? (uncontrolled ? internal : null);

  const { data, isPending: isLoading } = useQuery({
    queryKey: ['__internal__', React.useId(), search],
    queryFn: async (): Promise<(UserOption | User)[]> => [],
    ...fetchQueryOptions?.(search),
  });

  const excludeSet = useMemo(() => new Set(excludeOptions), [excludeOptions]);
  const options: UserOption[] = useMemo(() => {
    const opts: UserOption[] = extendOptions || [];

    const dataOpts = data?.map((d) => (isUserOption(d) ? d : userToOption(d)));
    if (dataOpts) opts.push(...dataOpts);

    const filtered = opts.filter((option) => !excludeSet.has(option.value));

    // unique by value
    const seen = new Set<string | null>(filtered.map((option) => option.value));
    return filtered.filter((option) => seen.delete(option.value) === true);
  }, [data, excludeSet, extendOptions]);

  const commit = useCallback(
    (next: UserOption | null) => {
      if (uncontrolled) setInternal(next);
      onChange?.(next);
    },
    [onChange, uncontrolled],
  );

  const TriggerElm = useMemo(
    () => (renderTrigger ? renderTrigger(selected) : null),
    [renderTrigger, selected],
  );

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
                  {selected.icon}
                  <span>{selected.label}</span>
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
                {options.map((option) => (
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
                    {option.icon && <span className='mr-2'>{option.icon}</span>}
                    <span>{option.label}</span>
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
