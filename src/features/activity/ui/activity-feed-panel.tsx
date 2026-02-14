'use client';

import React, { useState } from 'react';
import { Activity } from 'lucide-react';

import { ActivityFeed } from './activity-feed';
import { ActivityFeedFilters } from './activity-feed-filters';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { ActivityAction, ActivityEntity } from '@/contracts/activity';

// ==================== Component ====================

type Props = {
  orgId: string;
  projectId?: string;
};

export const ActivityFeedPanel: React.FC<Props> = ({ orgId, projectId }) => {
  const [filters, setFilters] = useState<{
    entity?: ActivityEntity;
    action?: ActivityAction;
  }>({});

  const queryParams = {
    orgId,
    ...(projectId ? { projectId } : {}),
    ...(filters.entity ? { entity: filters.entity } : {}),
    ...(filters.action ? { action: filters.action } : {}),
    limit: 25,
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className='flex flex-col h-full'>
        {/* Header */}
        <div className='flex items-center justify-between px-3 py-3 border-b'>
          <div className='flex items-center gap-2'>
            <Activity className='size-4 text-muted-foreground' />
            <h2 className='text-sm font-semibold'>Activity</h2>
          </div>
          <ActivityFeedFilters filters={filters} onChange={setFilters} />
        </div>

        {/* Feed */}
        <ScrollArea className='flex-1'>
          <ActivityFeed params={queryParams} showProject={!projectId} />
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
};
