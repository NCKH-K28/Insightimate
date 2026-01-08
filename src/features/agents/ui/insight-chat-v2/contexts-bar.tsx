import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useControlledState } from '@/hooks/use-controlled-state';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

const MAX_VISIBLE_ITEMS = 5;

export type ContextOption = {
  type: 'file' | 'sprint' | 'issue' | 'project';
  label: string;
  value: string;
  isLoading?: boolean;
  iconURL?: string;
  meta?: unknown;
};

export type ContextsBarProps = {
  selected?: ContextOption[];
  onChange?: (selected: ContextOption[]) => void;
};

const ItemAvatar = ({ option, size = 6 }: { option: ContextOption; size?: number }) => (
  <Avatar className={`h-${size} w-${size}`}>
    <AvatarImage src={option.iconURL} alt={option.label} />
    <AvatarFallback
      className={cn(
        'bg-primary/10 text-primary',
        size < 6 && 'text-[10px]',
        size >= 6 && 'text-xs',
      )}
    >
      {option.label.charAt(0).toUpperCase()}
    </AvatarFallback>
  </Avatar>
);

const LoadingOrRemove = ({
  isLoading,
  onRemove,
  small,
}: {
  isLoading?: boolean;
  onRemove: () => void;
  small?: boolean;
}) =>
  isLoading ? (
    <Loader2
      className={cn('animate-spin', small ? 'h-3. 5 w-3.5 text-foreground/50' : 'h-4 w-4')}
    />
  ) : (
    <X
      className={cn(
        'cursor-pointer rounded-full',
        small
          ? 'h-3.5 w-3.5 text-foreground/60 hover:text-destructive'
          : 'h-4 w-4 bg-foreground text-background/90 hover:bg-foreground/80',
      )}
      onClick={onRemove}
    />
  );

const ContextItem = ({
  option,
  onRemove,
}: {
  option: ContextOption;
  onRemove: (v: string) => void;
}) => (
  <div className='group relative flex items-center max-w-60 overflow-hidden rounded-full border border-border/50 bg-accent/30 transition-all duration-200 hover:bg-accent/50 hover:shadow-sm'>
    <div
      className={cn(
        'absolute inset-0 z-10 flex items-center px-2 opacity-0 transition-opacity duration-200',
        option.isLoading ? 'opacity-100' : 'group-hover:opacity-100',
      )}
    >
      <LoadingOrRemove isLoading={option.isLoading} onRemove={() => onRemove(option.value)} />
    </div>
    <div className='flex items-center gap-1 px-1 py-1'>
      <ItemAvatar option={option} />
      <span
        className='max-w-40 truncate text-xs font-medium text-foreground/80 transition-colors duration-200 group-hover:text-foreground/60'
        title={option.label}
      >
        {option.label}
      </span>
    </div>
  </div>
);

type OverflowIndicatorProps = {
  items: ContextOption[];
  onRemove: (v: string) => void;
};
const OverflowIndicator = ({ items, onRemove }: OverflowIndicatorProps) => {
  const loadingCount = items.filter((i) => i.isLoading).length;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className='flex cursor-pointer items-center justify-center gap-1.5 overflow-hidden rounded-full border border-border/50 bg-accent/30 px-3 py-1 hover:bg-accent/50'>
          {loadingCount > 0 && <Loader2 className='h-3 w-3 animate-spin text-foreground/60' />}
          <span className='text-xs font-medium text-foreground/80'>
            +{items.length} more{loadingCount > 0 && ` (${loadingCount} loading)`}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent className='p-0' sideOffset={8}>
        <ScrollArea className='max-h-48 w-64 bg-background'>
          <div className='flex flex-col gap-1 p-2'>
            {items.map((o) => (
              <ContextItem key={o.value} option={o} onRemove={onRemove} />
            ))}
          </div>
        </ScrollArea>
      </TooltipContent>
    </Tooltip>
  );
};

export const ContextsBar = ({ selected: selectedProp, onChange }: ContextsBarProps) => {
  const [selected, setSelected] = useControlledState<ContextOption[]>(selectedProp, [], onChange);
  const handleRemove = (value: string) => setSelected(selected.filter((o) => o.value !== value));

  if (!selected.length) return null;

  const [visibleItems, overflowItems] = [
    selected.slice(0, MAX_VISIBLE_ITEMS),
    selected.slice(MAX_VISIBLE_ITEMS),
  ];

  return (
    <div className='flex flex-wrap items-center gap-1 p-2'>
      {visibleItems.map((o) => (
        <ContextItem key={o.value} option={o} onRemove={handleRemove} />
      ))}
      {overflowItems.length > 0 && (
        <OverflowIndicator items={overflowItems} onRemove={handleRemove} />
      )}
    </div>
  );
};
