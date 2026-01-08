import { ArrowDown, ArrowUp, BookOpen, Bug, CheckCircle2, Circle } from 'lucide-react';
import { Flame, Minus, Zap } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserIcon } from 'lucide-react';

type IssueFields = { id: string; name: string; color?: string | null; iconURL?: string | null };
type IssueType = IssueFields;
type IssuePriority = IssueFields;
type IssueStatus = IssueFields & { category: 'TODO' | 'IN_PROGRESS' | 'DONE' };
type User = { id: string; name: string; email: string; avatarURL?: string | null };

// ============================================================================
// Helper Components
// ============================================================================

function IssueTypeIcon({ type, className }: { type: IssueType; className?: string }) {
  const iconProps: React.SVGProps<SVGSVGElement> = {
    className: cn('h-4 w-4', className),
    style: { color: type.color ?? undefined },
  };

  switch (type.name.toLowerCase()) {
    case 'story':
      return <BookOpen {...iconProps} />;
    case 'bug':
      return <Bug {...iconProps} />;
    case 'task':
      return <CheckCircle2 {...iconProps} />;
    case 'epic':
      return <Flame {...iconProps} />;
    case 'spike':
      return <Zap {...iconProps} />;
    default:
      return <Circle {...iconProps} />;
  }
}

function PriorityIcon({
  priority,
  showLabel = false,
}: {
  priority: IssuePriority;
  showLabel?: boolean;
}) {
  const iconClass = 'h-4 w-4';
  let icon: React.ReactNode;
  let colorClass: string;

  switch (priority.name.toLowerCase()) {
    case 'highest':
      icon = <ArrowUp className={iconClass} />;
      colorClass = 'text-red-600';
      break;
    case 'high':
      icon = <ArrowUp className={iconClass} />;
      colorClass = 'text-orange-500';
      break;
    case 'medium':
      icon = <Minus className={iconClass} />;
      colorClass = 'text-yellow-500';
      break;
    case 'low':
      icon = <ArrowDown className={iconClass} />;
      colorClass = 'text-green-500';
      break;
    case 'lowest':
      icon = <ArrowDown className={iconClass} />;
      colorClass = 'text-blue-500';
      break;
    default:
      icon = <Minus className={iconClass} />;
      colorClass = 'text-slate-400';
  }

  return (
    <TooltipProvider>
      <UITooltip>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex items-center gap-1', colorClass)}>
            {icon}
            {showLabel && <span className='text-xs'>{priority.name}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Priority: {priority.name}</p>
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
}

function StatusBadge({ status, size = 'sm' }: { status: IssueStatus; size?: 'sm' | 'md' }) {
  const categoryStyles = {
    TODO: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
    DONE: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <Badge
      variant='outline'
      className={cn(
        'font-medium transition-colors cursor-pointer',
        categoryStyles[status.category],
        sizeStyles[size],
      )}
    >
      {status.name}
    </Badge>
  );
}

function UserAvatar({
  user,
  size = 'sm',
  showTooltip = true,
}: {
  user?: User;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (!user) {
    return (
      <div
        className={cn(
          'rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-200',
          sizeClasses[size],
        )}
      >
        <UserIcon className='h-3 w-3 text-slate-400' />
      </div>
    );
  }

  const avatar = (
    <Avatar className={cn(sizeClasses[size], 'border-2 border-white shadow-sm')}>
      <AvatarImage src={user.avatarURL ?? undefined} alt={user.name} />
      <AvatarFallback
        className={cn(
          'bg-linear-to-br from-blue-500 to-purple-600 text-white',
          textSizeClasses[size],
        )}
      >
        {user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );

  if (!showTooltip) return avatar;

  return (
    <TooltipProvider>
      <UITooltip>
        <TooltipTrigger asChild>{avatar}</TooltipTrigger>
        <TooltipContent>
          <div className='flex items-center gap-2'>
            <Avatar className='h-6 w-6'>
              <AvatarImage src={user.avatarURL ?? undefined} alt={user.name} />
              <AvatarFallback className='text-xs'>
                {user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className='font-medium'>{user.name}</p>
              <p className='text-xs text-muted-foreground'>{user.email}</p>
            </div>
          </div>
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
}

function UserAvatarGroup({ users, max = 3 }: { users: User[]; max?: number }) {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className='flex -space-x-2'>
      {visibleUsers.map((user) => (
        <UserAvatar key={user.id} user={user} size='sm' />
      ))}
      {remainingCount > 0 && (
        <TooltipProvider>
          <UITooltip>
            <TooltipTrigger asChild>
              <div className='h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600 border-2 border-white'>
                +{remainingCount}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className='space-y-1'>
                {users.slice(max).map((user) => (
                  <p key={user.id}>{user.name}</p>
                ))}
              </div>
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

function StoryPointsBadge({ points, size = 'sm' }: { points?: number; size?: 'sm' | 'md' }) {
  if (points === undefined) return null;

  const sizeClasses = {
    sm: 'h-5 min-w-5 px-1.5 text-xs',
    md: 'h-6 min-w-6 px-2 text-sm',
  };

  return (
    <TooltipProvider>
      <UITooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center justify-center font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors',
              sizeClasses[size],
            )}
          >
            {points}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {points} story point{points !== 1 ? 's' : ''}
          </p>
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
}

export { IssueTypeIcon, PriorityIcon, StatusBadge, UserAvatar, UserAvatarGroup, StoryPointsBadge };
