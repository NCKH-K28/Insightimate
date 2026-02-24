'use client';

import React from 'react';

import { StatsCards } from './stats-cards';
import { RecentProjects } from './recent-projects';
import { AssignedToMe } from './assigned-to-me';
import { ActivityFeedPanel } from '@/features/activity/ui/activity-feed-panel';

import type { DashboardData } from '@/features/organization/server/dashboard.service';

// ==================== Types ====================

type OrgDashboardProps = {
  data: DashboardData;
  orgId: string;
  orgSlug: string;
  orgName: string;
};

// ==================== Component ====================

export const OrgDashboard: React.FC<OrgDashboardProps> = ({ data, orgId, orgSlug, orgName }) => {
  return (
    <div className='space-y-6'>
      {/* Page header */}
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
        <p className='text-muted-foreground text-sm mt-1'>
          Overview of <span className='font-medium text-foreground'>{orgName}</span>
        </p>
      </div>

      {/* Stats */}
      <StatsCards stats={data.stats} />

      {/* 2-column layout: main content + activity sidebar */}
      <div className='grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6'>
        {/* Left column */}
        <div className='space-y-6 min-w-0'>
          <RecentProjects projects={data.recentProjects} orgSlug={orgSlug} />
          <AssignedToMe issues={data.assignedToMe} />
        </div>

        {/* Right column — Activity feed */}
        <div className='hidden xl:block'>
          <div className='rounded-xl border bg-card shadow-sm overflow-hidden sticky top-6 max-h-[calc(100dvh-8rem)]'>
            <ActivityFeedPanel orgId={orgId} />
          </div>
        </div>
      </div>

      {/* Activity feed for mobile/tablet (below main content) */}
      <div className='xl:hidden'>
        <div className='rounded-xl border bg-card shadow-sm overflow-hidden'>
          <ActivityFeedPanel orgId={orgId} />
        </div>
      </div>
    </div>
  );
};
