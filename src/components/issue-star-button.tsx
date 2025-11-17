'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface IssueStarButtonProps {
  issueId: string;
  userId?: string;
  initialIsStarred?: boolean;
  initialStarCount?: number;
  onStarToggle?: (isStarred: boolean) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  variant?: 'button' | 'icon-only';
}

export function IssueStarButton({
  issueId,
  userId,
  initialIsStarred = false,
  initialStarCount = 0,
  onStarToggle,
  className,
  size = 'md',
  showCount = true,
  variant = 'button',
}: IssueStarButtonProps) {
  const [isStarred, setIsStarred] = useState(initialIsStarred);
  const [starCount, setStarCount] = useState(initialStarCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStarredUsers, setShowStarredUsers] = useState(false);
  const [starredUsers, setStarredUsers] = useState<any[]>([]);

  // Nếu không có userId, không hiển thị button
  if (!userId) {
    return null;
  }

  const handleToggleStar = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const method = isStarred ? 'DELETE' : 'POST';
      const response = await fetch(`/api/v2/issues/${issueId}/star`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle star');
      }

      const data = await response.json();
      
      // Cập nhật state
      setIsStarred(!isStarred);
      setStarCount(data.starCount ?? starCount);

      // Callback
      onStarToggle?.(!isStarred);

      // Reset error
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      console.error('Error toggling star:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStarredUsers = async () => {
    try {
      const response = await fetch(`/api/v2/issues/${issueId}/star/users`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStarredUsers(data.users ?? []);
      }
    } catch (err) {
      console.error('Error fetching starred users:', err);
    }
  };

  const handleShowStarredUsers = async () => {
    if (!showStarredUsers) {
      await fetchStarredUsers();
    }
    setShowStarredUsers(!showStarredUsers);
  };

  // Kích thước icon
  const iconSizeMap = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  const iconSize = iconSizeMap[size];

  // Nút chính
  const starButton = (
    <Button
      variant="ghost"
      size={size === 'lg' ? 'default' : 'sm'}
      onClick={handleToggleStar}
      disabled={isLoading}
      className={cn(
        'gap-2 transition-all duration-200',
        isStarred ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-yellow-500',
        variant === 'icon-only' && 'p-2',
        className
      )}
      title={isStarred ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star
        size={iconSize}
        className={cn(
          'transition-all duration-300',
          isStarred && 'fill-current'
        )}
      />
      {showCount && variant === 'button' && (
        <span className={cn(
          'text-xs font-medium',
          isStarred ? 'text-yellow-500' : 'text-gray-500'
        )}>
          {starCount > 0 ? starCount : ''}
        </span>
      )}
      {isLoading && (
        <span className="inline-block animate-spin">⏳</span>
      )}
    </Button>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative inline-block">
            {starButton}

            {/* Dropdown: Danh sách người đã star */}
            {showStarredUsers && starredUsers.length > 0 && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[240px]">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-700">
                    Starred by {starCount} user{starCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {starredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="px-3 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      {user.avatar && (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span className="text-sm text-gray-700">{user.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Badge hiển thị số lượng star khi hover */}
            {showCount && starCount > 0 && variant === 'icon-only' && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {starCount > 99 ? '99+' : starCount}
              </span>
            )}

            {/* Error message */}
            {error && (
              <div className="absolute top-full left-0 mt-2 bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-600 whitespace-nowrap">
                {error}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isStarred ? 'Remove from favorites' : 'Add to favorites'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================
// VARIANT: Star Count Display Only (không thể click)
// ============================================================

interface IssueStarCountProps {
  starCount: number;
  className?: string;
  showLabel?: boolean;
}

export function IssueStarCount({
  starCount,
  className,
  showLabel = false,
}: IssueStarCountProps) {
  return (
    <div className={cn('flex items-center gap-1 text-gray-600', className)}>
      <Star size={16} className="text-yellow-500" fill="currentColor" />
      <span className="text-sm font-medium">
        {starCount}
        {showLabel && <span className="ml-1">star{starCount !== 1 ? 's' : ''}</span>}
      </span>
    </div>
  );
}

// ============================================================
// VARIANT: Compact Star Display (cho list view)
// ============================================================

interface CompactStarDisplayProps {
  isStarred: boolean;
  starCount: number;
  onClick?: () => void;
  disabled?: boolean;
}

export function CompactStarDisplay({
  isStarred,
  starCount,
  onClick,
  disabled,
}: CompactStarDisplayProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded transition-colors',
        isStarred
          ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
          : 'bg-gray-50 text-gray-500 hover:bg-gray-100',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <Star
        size={14}
        className={cn(isStarred && 'fill-current')}
      />
      <span className="text-xs font-medium">{starCount}</span>
    </button>
  );
}

// ============================================================
// VARIANT: Star Picker (hiển thị danh sách issue mà user star)
// ============================================================

interface StarPickerProps {
  starredIssues?: Array<{
    id: string;
    key: string;
    summary: string;
  }>;
  isLoading?: boolean;
  onIssueClick?: (issueId: string) => void;
  className?: string;
}

export function StarPicker({
  starredIssues = [],
  isLoading = false,
  onIssueClick,
  className,
}: StarPickerProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-t-lg">
        <Star size={16} className="text-yellow-500" fill="currentColor" />
        <span className="text-sm font-semibold text-gray-700">
          My Starred Issues ({starredIssues.length})
        </span>
      </div>

      {isLoading && (
        <div className="p-3 text-center text-sm text-gray-500">
          Loading starred issues...
        </div>
      )}

      {!isLoading && starredIssues.length === 0 && (
        <div className="p-3 text-center text-sm text-gray-400">
          No starred issues yet
        </div>
      )}

      {!isLoading && starredIssues.length > 0 && (
        <div className="border border-gray-200 rounded-b-lg overflow-hidden">
          {starredIssues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => onIssueClick?.(issue.id)}
              className="px-3 py-2 hover:bg-yellow-50 cursor-pointer border-b last:border-b-0 transition-colors"
            >
              <p className="text-xs font-semibold text-gray-600">{issue.key}</p>
              <p className="text-sm text-gray-700">{issue.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
