import { useSuspenseQuery } from '@tanstack/react-query';
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
import { getProjectQueryOptions } from '@/features/projects/api/actions';
import { useControlledState } from '@/hooks/use-controlled-state';

export type IssueType = {
  id: string;
  name: string;
  iconURL?: string | null;
  color?: string | null;
  hierarchy: number;
};

export type IssueTypeSelectorsProps = {
  params: { projectId: string };
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (type: string | null) => void;
  onFetched?: (types: IssueType[], setValue: (value: string | null) => void) => void;
  required?: boolean;

  filterFn?: (type: IssueType, types: IssueType[]) => boolean;
};

export const IssueTypeSelectors = ({
  params,
  onFetched,
  onChange,
  required = false,
  filterFn,
  defaultValue,
  ...props
}: IssueTypeSelectorsProps) => {
  const [open, setOpen] = useState(false);

  const [value, setValue] = useControlledState<string | null>(
    props.value,
    defaultValue ?? null,
    onChange,
  );

  const { data: types } = useSuspenseQuery({
    ...getProjectQueryOptions(params),
    select: (data) => data?.types || [],
  });

  const filteredTypes = useMemo(() => {
    if (!filterFn) return types;
    return types.filter((type) => filterFn(type, types));
  }, [types, filterFn]);

  // Sort types by hierarchy
  const sortedTypes = useMemo(() => {
    return [...filteredTypes].sort((a, b) => b.hierarchy - a.hierarchy);
  }, [filteredTypes]);

  // Find the currently selected type
  const selectedType = useMemo(() => {
    return sortedTypes.find((type) => type.id === value) || null;
  }, [sortedTypes, value]);

  // Notify parent when types are fetched
  useEffect(() => {
    if (onFetched) onFetched(types, setValue);
  }, [types, onFetched, setValue]);

  const handleSelect = (type: IssueType) => {
    const newValue = type.id === selectedType?.id && !required ? null : type.id;
    setValue(newValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size='sm'
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full justify-between'
        >
          {selectedType ? (
            <div className='flex items-center gap-2'>
              {selectedType.iconURL && (
                <Image
                  src={selectedType.iconURL}
                  alt={selectedType.name}
                  width={16}
                  height={16}
                  className='rounded-sm'
                />
              )}
              {selectedType.color && !selectedType.iconURL && (
                <span
                  className='h-4 w-4 rounded-sm'
                  style={{ backgroundColor: selectedType.color }}
                />
              )}
              <span>{selectedType.name}</span>
            </div>
          ) : (
            <span className='text-muted-foreground'>Select issue type... </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[200px] p-0' align='start'>
        <Command>
          <CommandInput placeholder='Search issue type...' />
          <CommandList>
            <CommandEmpty>No issue type found. </CommandEmpty>
            <CommandGroup>
              {sortedTypes.map((type) => (
                <CommandItem
                  key={type.id}
                  value={type.name}
                  onSelect={() => handleSelect(type)}
                  className='flex items-center gap-2'
                >
                  {type.iconURL ? (
                    <Image
                      src={type.iconURL}
                      alt={type.name}
                      width={16}
                      height={16}
                      className='rounded-sm'
                    />
                  ) : type.color ? (
                    <span className='h-4 w-4 rounded-sm' style={{ backgroundColor: type.color }} />
                  ) : (
                    <span className='h-4 w-4' />
                  )}
                  <span className='flex-1'>{type.name}</span>
                  <CheckIcon
                    className={cn(
                      'h-4 w-4',
                      selectedType?.id === type.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
