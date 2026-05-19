'use client';

import { useState } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface LogoProps {
  in_use?: 'emoji' | 'icon';
  emoji?: { value: string };
  icon?: { name: string; color: string };
}

interface LogoPickerProps {
  value?: LogoProps | null;
  onChange: (logo: LogoProps) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😊', '🤓', '😎', '🤩', '🥳', '🤗'],
  'Objects': ['🚀', '💡', '🔧', '⚙️', '📦', '🎯', '📊', '🔔', '📌', '🏷️'],
  'Nature': ['🌟', '⭐', '🔥', '💎', '🌈', '🌊', '🍀', '🌸', '🌻', '⚡'],
  'Symbols': ['✅', '❤️', '💜', '💙', '💚', '💛', '🧡', '🤍', '🖤', '🤎'],
  'Hands': ['👍', '👏', '🙌', '🤝', '💪', '✋', '🤞', '✌️', '👌', '🫡'],
};

export function LogoPicker({ value, onChange, disabled, size = 'md' }: LogoPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentEmoji =
    value?.in_use === 'emoji' && value.emoji?.value ? value.emoji.value : null;

  const sizeClasses = {
    sm: 'h-8 w-8 text-lg',
    md: 'h-10 w-10 text-xl',
    lg: 'h-14 w-14 text-3xl',
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            sizeClasses[size],
            'rounded-xl border-2 border-dashed border-border/60 p-0',
            'hover:border-primary/40 hover:bg-primary/5',
            'transition-all duration-200',
            currentEmoji && 'border-solid border-border/30',
          )}
          disabled={disabled}
        >
          {currentEmoji ? (
            <span>{currentEmoji}</span>
          ) : (
            <Smile className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Choose an emoji</p>
          {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
            <div key={category} className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                {category}
              </p>
              <div className="flex flex-wrap gap-1">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md text-base transition-colors',
                      'hover:bg-primary/10',
                      currentEmoji === emoji && 'bg-primary/15 ring-1 ring-primary/30',
                    )}
                    onClick={() => {
                      onChange({ in_use: 'emoji', emoji: { value: emoji } });
                      setIsOpen(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
