import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import groupBy from 'lodash/groupBy';
import { cn } from '@/lib/utils';
import { queryApi } from '@/features/query/http';
import debounce from 'lodash/debounce';

const typeFormat = (type: string) => {
  if (!type) return 'Unknown';
  return type;
};

type Options = { label: string; value: string; iconURL?: string; type?: string };

type SelectorContentProps = {
  selected?: Options[];
  close?: () => void;
  onSelect?: (option: Options) => void;
};

const SelectorContent = ({ close, onSelect, selected }: SelectorContentProps) => {
  const [debouncedTerm, setTerm] = useState<string>('');

  const selectedMap = useMemo(
    () => new Map(selected?.map((s) => [s.value, true]) || []),
    [selected],
  );

  const debouncedSetTerm = useMemo(() => debounce(setTerm, 300), []);

  const { data: contexts, isPending } = useQuery<Options[]>({
    queryKey: ['context-options', debouncedTerm],
    queryFn: async () => {
      const trimmed = debouncedTerm.trim();
      const res = await queryApi.searchV2({ q: trimmed });
      const data = res.hits.map((item) => ({
        value: item.id,
        label: item.source.name || item.source.summary || 'Unnamed',
        type: item.type,
        iconURL: item.source.avatarURL || item.source.iconURL || undefined,
      }));
      return data;
    },
  });

  const handleSelect = (option: Options) => {
    if (onSelect) onSelect(option);
    if (close) close();
  };

  const options = useMemo(() => {
    return groupBy(contexts, (opt) => (opt.type ? typeFormat(opt.type) : 'Others'));
  }, [contexts]);

  return (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder='Type to search contexts...'
        defaultValue={debouncedTerm}
        onValueChange={debouncedSetTerm}
      />
      <CommandList className='max-h-60 overflow-y-auto flex flex-col gap-2'>
        {isPending && <div className='p-2 text-center text-sm'>Loading...</div>}
        {!isPending && <CommandEmpty>Empty</CommandEmpty>}

        {Object.entries(options).map(([group, items]) => (
          <CommandGroup key={group} heading={group}>
            {items.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => handleSelect(option)}
                className={cn({ 'bg-accent/20': selectedMap.has(option.value) })}
              >
                <span>{option.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
};

export type ContextSelectorProps = {
  selected?: Options[];
  onSelect?: (option: Options) => void;
  renderTrigger?: (props: {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  }) => React.ReactNode;
};
export const ContextSelector = (props: ContextSelectorProps) => {
  const [open, setOpen] = useState(false);

  const renderedTrigger = props.renderTrigger ? props.renderTrigger({ open, setOpen }) : null;

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        {renderedTrigger ? renderedTrigger : <Button variant='outline'>Select Context</Button>}
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' side='top'>
        <SelectorContent
          selected={props.selected}
          close={() => setOpen(false)}
          onSelect={props.onSelect}
        />
      </PopoverContent>
    </Popover>
  );
};
