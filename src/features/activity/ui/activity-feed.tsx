'use client';

import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { format, isToday, isYesterday } from 'date-fns';
import { Loader2, Activity } from 'lucide-react';

import { activityQueries } from '@/features/activity/api/actions';
import { ActivityFeedItem } from './activity-feed-item';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import type { ActivityFeedQuery, ActivityEventWithActor } from '@/contracts/activity';

// ==================== Date Grouping ====================

function dateGroupLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMMM d');
}

function groupByDate(items: ActivityEventWithActor[]): Map<string, ActivityEventWithActor[]> {
  const groups = new Map<string, ActivityEventWithActor[]>();
  for (const item of items) {
    const label = dateGroupLabel(item.createdAt);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(item);
  }
  return groups;
}

// ==================== Skeleton ====================

function FeedSkeleton() {
  return (
    <div className='space-y-3 p-3'>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className='flex items-start gap-3'>
          <Skeleton className='size-8 rounded-full shrink-0' />
          <div className='flex-1 space-y-1.5'>
            <Skeleton className='h-4 w-[75%]' />
            <Skeleton className='h-3 w-[50%]' />
          </div>
          <Skeleton className='h-4 w-16' />
        </div>
      ))}
    </div>
  );
}

// ==================== Empty State ====================

function EmptyState() {
  return (
    <div className='flex flex-col items-center justify-center py-16 text-center'>
      <div className='rounded-full bg-muted p-4 mb-4'>
        <Activity className='size-8 text-muted-foreground' />
      </div>
      <h3 className='text-lg font-semibold'>No activity yet</h3>
      <p className='text-sm text-muted-foreground mt-1 max-w-sm'>
        Activity events will appear here as your team creates projects, manages issues, and
        collaborates.
      </p>
    </div>
  );
}

// ==================== Component ====================

type Props = {
  params: ActivityFeedQuery;
  /** Show project key badge on each item (useful in org-level feeds) */
  showProject?: boolean;
};

export const ActivityFeed: React.FC<Props> = ({ params, showProject = true }) => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } =
    useInfiniteQuery(activityQueries.list(params));

  // --- Infinite scroll observer ---
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  // --- Flatten pages ---
  const allItems = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  const grouped = useMemo(() => groupByDate(allItems), [allItems]);

  // --- Renders ---
  if (isLoading) return <FeedSkeleton />;

  if (isError) {
    return (
      <div className='p-6 text-center text-sm text-destructive'>
        Failed to load activity feed{error?.message ? `: ${error.message}` : '.'}
      </div>
    );
  }

  if (allItems.length === 0) return <EmptyState />;

  return (
    <div className='space-y-1'>
      {Array.from(grouped.entries()).map(([label, items], groupIdx) => (
        <div key={label}>
          {/* Date separator */}
          <div className='sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-3 py-2'>
            <div className='flex items-center gap-3'>
              <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                {label}
              </span>
              <Separator className='flex-1' />
            </div>
          </div>

          {/* Items */}
          {items.map((event) => (
            <ActivityFeedItem key={event.id} event={event} showProject={showProject} />
          ))}
        </div>
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className='h-1' />

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <div className='flex items-center justify-center py-4'>
          <Loader2 className='size-4 animate-spin text-muted-foreground' />
          <span className='ml-2 text-xs text-muted-foreground'>Loading more…</span>
        </div>
      )}
    </div>
  );
};
