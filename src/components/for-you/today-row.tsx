import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export function TodayRow({
  title,
  meta,
  Icon,
  action,
  actor,
  onClick,
}: {
  title: string;
  meta: string;
  checked?: boolean;
  Icon: React.ComponentType<{ className?: string }>;
  action?: string;
  actor?: { name?: string; avatar?: string | null };
  onClick?: () => void;
}) {
  const initials = actor?.name ? actor.name : title.slice(0, 2).toUpperCase();

  return (
    <div
      role='button'
      tabIndex={0}
      className='flex items-center gap-3 rounded-xl border p-3 hover:bg-accent/30 cursor-pointer'
      onClick={(e) => {
        onClick?.();
      }}
    >
      <Icon className='mt-0.5 h-5 w-5 text-muted-foreground' />
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2'>
          <p className='font-medium leading-none truncate'>{title}</p>
        </div>
        <p className='text-xs text-muted-foreground mt-1 truncate'>{meta}</p>
      </div>

      <div className='ml-auto flex items-center gap-2'>
        {action && (
          <Badge className='h-5'>
            {action}
          </Badge>
        )}
        <Avatar className='h-8 w-8'>
          {actor?.avatar ? (
            <AvatarImage src={actor.avatar} alt={actor?.name ?? initials} />
          ) : (
            <AvatarFallback>{initials}</AvatarFallback>
          )}
        </Avatar>
      </div>
    </div>
  );
}

export default TodayRow;
