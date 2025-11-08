import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AtSign, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContextSelector } from '../context-selector';

type Options = { label: string; value: string; iconURL?: string };

export const SelectionBar = () => {
  const [selecteds, setSelecteds] = useState<Options[]>([]);

  const removeSelection = (v: string) => {
    setSelecteds((prev) => prev.filter((item) => item.value !== v));
  };

  return (
    <div className='flex items-center gap-2 flex-wrap'>
      <ContextSelector
        onSelect={(o) => {
          setSelecteds((prev) => {
            const exists = prev.find((item) => item.value === o.value);
            if (exists) return prev;
            return [...prev, o];
          });
        }}
        renderTrigger={() => (
          <Button
            size='sm'
            className={cn(
              'rounded-full text-xs transition-all duration-200',
              'hover:scale-105 active:scale-95',
              selecteds.length === 0
                ? 'text-muted-foreground border-dashed'
                : 'text-muted-foreground/70 hover:text-foreground',
            )}
            variant='outline'
          >
            {selecteds.length === 0 ? (
              <>
                <AtSign className='w-3 h-3 mr-1' />
                Add Context
              </>
            ) : (
              <Plus className='w-3 h-3' />
            )}
          </Button>
        )}
      />

      {selecteds.map((option) => (
        <div
          key={option.value}
          className={cn(
            'group flex items-center relative',
            'rounded-full overflow-hidden',
            'bg-accent/30 hover:bg-accent/50 border border-border/50',
            'transition-all duration-200 hover:shadow-sm',
            'max-w-[240px]',
          )}
        >
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-start px-2',
              'opacity-0 group-hover:opacity-100',
              'transition-opacity duration-200',
              'z-10',
            )}
          >
            <X
              className={cn(
                'w-4 h-4 cursor-pointer rounded-full',
                'bg-foreground text-background/90 hover:bg-foreground/80',
              )}
              onClick={() => removeSelection(option.value)}
            />
          </div>

          {/* Content */}
          <div className='flex items-center gap-1 px-1 py-1'>
            <Avatar className='w-6 h-6'>
              <AvatarImage src={option.iconURL} alt={option.label} />
              <AvatarFallback className='text-xs bg-primary/10 text-primary'>
                {option.label.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <span
              className={cn(
                'text-xs font-medium text-foreground/80',
                'truncate max-w-[160px]', // Truncate text nếu quá dài
                'group-hover:text-foreground/60 transition-colors duration-200',
              )}
              title={option.label} // Tooltip để hiển thị full text
            >
              {option.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
