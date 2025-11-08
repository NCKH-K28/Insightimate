import React, { useMemo } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { QueryOptions, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { XIcon } from 'lucide-react';
import debounce from 'lodash/debounce';

type MOption = {
  value: string;
  label: string;
  iconURL?: string;
  renderLabel?: (props: { className?: string }) => React.ReactNode;
  renderIcon?: (props: { className?: string }) => React.ReactNode;
};

type SearchQueryOptions = UseQueryOptions<any, any, MOption[], any>;
type SearchOptionsFn = (query: string, excluded?: string[]) => SearchQueryOptions;

type MuilSelectorsProps = {
  selected?: MOption[];
  onChange?: (selected: MOption[]) => void;
  excluded?: string[];
  extended?: MOption[];
  searchQueryOptions?: SearchQueryOptions | SearchOptionsFn;
  inputProps?: { placeholder?: string; className?: string };
  className?: string;
};

export const MuilSelectors = (props: MuilSelectorsProps) => {
  const [q, setQ] = React.useState('');

  const [_selected, _setSelected] = React.useState<MOption[]>(props.selected ?? []);
  const selected = useMemo(() => props.selected ?? _selected, [props.selected, _selected]);
  const setSelected: typeof _setSelected = (v) => {
    if (typeof v === 'function') {
      const newValue = v(selected);
      if (!props.selected) _setSelected(newValue);
      else props.onChange?.(newValue);
    } else {
      if (!props.selected) _setSelected(v);
      else props.onChange?.(v);
    }
  };

  const debouncedSetQ = React.useMemo(() => debounce(setQ, 300), []);

  const searchQueryOptions = useMemo((): SearchQueryOptions => {
    // log type of props.searchQueryOptions
    console.log('MuilSelectors - searchQueryOptions type:', typeof props.searchQueryOptions);
    if (!props.searchQueryOptions) {
      return {
        queryKey: ['__resource-muil-selectors', q, props.excluded, props.extended],
        queryFn: async () => [],
        initialData: props.extended,
        enabled: q.length > 0,
      };
    }
    // log
    const qOptions =
      typeof props.searchQueryOptions === 'function'
        ? props.searchQueryOptions(q, props.excluded)
        : props.searchQueryOptions;
    return qOptions;
  }, [props.searchQueryOptions, q, props.excluded, props.extended]);

  const { data: options, isPending } = useQuery({ enabled: q.length > 0, ...searchQueryOptions });

  const handleSelect = (option: MOption) => {
    const exists = selected.find((s) => s.value === option.value);
    let newSelected: MOption[];
    if (exists) newSelected = selected.filter((s) => s.value !== option.value);
    else newSelected = [...selected, option];
    setSelected(newSelected);
  };

  const renderIcon = (opt: MOption) => {
    if (opt.renderIcon) return opt.renderIcon({ className: 'mr-2 size-4' });
    return (
      <Avatar>
        <AvatarImage src={opt.iconURL} className='rounded-sm' />
        <AvatarFallback className='rounded-sm'>{opt.label[0]}</AvatarFallback>
      </Avatar>
    );
  };

  const renderLabel = (opt: MOption) => {
    if (opt.renderLabel) return opt.renderLabel({});
    return opt.label;
  };

  return (
    <Command className={props.className}>
      <CommandInput
        autoFocus
        placeholder='Search options...'
        onValueChange={(text) => debouncedSetQ(text)}
      />
      <CommandList>
        <CommandEmpty>
          {q.trim().length === 0
            ? 'Type to search options'
            : isPending
            ? 'Loading options...'
            : 'No options found.'}
        </CommandEmpty>
        <CommandGroup
          className='max-h-60 overflow-y-auto'
          //
        >
          {options?.map((opt) => (
            <CommandItem
              key={opt.value}
              value={opt.label}
              onSelect={() => handleSelect(opt)}
              data-active={selected.some((r) => r.value === opt.value)}
              className='data-[active=true]:opacity-50'
            >
              {renderIcon(opt)}
              {renderLabel(opt)}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>

      <div className='flex flex-wrap gap-2 p-1 px-2'>
        {selected.length === 0 && (
          <span className='text-sm text-muted-foreground'>No options selected</span>
        )}
        {selected.map((opt) => (
          <Tooltip key={opt.value}>
            <TooltipTrigger asChild>
              <div className='relative inline-block'>
                {renderIcon(opt)}
                <XIcon
                  className='absolute inset-0 opacity-0 hover:opacity-100 bg-black/50 text-white cursor-pointer m-auto rounded-full p-1'
                  onClick={() => {
                    setSelected((prev) => prev.filter((r) => r.value !== opt.value));
                  }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className='max-w-xs'>{opt.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </Command>
  );
};
