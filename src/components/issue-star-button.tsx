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
  initialIsStarred = false,
  initialStarCount = 0,
  onStarToggle,
  className,
  size = 'md',
  showCount = true,
  variant = 'button',
}: IssueStarButtonProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isStarred, setIsStarred] = useState(initialIsStarred);
  const [starCount, setStarCount] = useState(initialStarCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStarredUsers, setShowStarredUsers] = useState(false);
  const [starredUsers, setStarredUsers] = useState<any[]>([]);

  // ⭐ Fetch userId bên trong client component
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        const data = await res.json();
        setUserId(data.id);  // <-- userId tự gán ở đây
      } catch (err) {
        console.error("❌ Error fetching current user:", err);
      }
    };
    fetchUser();
  }, []);

  // Nếu chưa có userId → chưa render gì cả (tránh lỗi)
  if (!userId) return null;

  const handleToggleStar = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const method = isStarred ? 'DELETE' : 'POST';
      const response = await fetch(`/api/v2/star/${issueId}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
      });

      if (!response.ok) throw new Error('Failed to toggle star');

      const data = await response.json();

      setIsStarred(!isStarred);
      setStarCount(data.starCount ?? starCount);
      onStarToggle?.(!isStarred);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      console.error('Error toggling star:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStarredUsers = async () => {
    try {
      const res = await fetch(`/api/v2/star/${issueId}/users`, {
        headers: { 'x-user-id': userId },
      });

      if (res.ok) {
        const data = await res.json();
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

  const iconSizeMap = { sm: 16, md: 18, lg: 20 };
  const iconSize = iconSizeMap[size];

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
        className={cn('transition-all duration-300', isStarred && 'fill-current')}
      />
      {showCount && variant === 'button' && (
        <span
          className={cn(
            'text-xs font-medium',
            isStarred ? 'text-yellow-500' : 'text-gray-500'
          )}
        >
          {starCount > 0 ? starCount : ''}
        </span>
      )}
      {isLoading && <span className="inline-block animate-spin">⏳</span>}
    </Button>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative inline-block">
            {starButton}

            {/* Dropdown danh sách người đã star */}
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
