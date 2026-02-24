'use client';

import React from 'react';

import { StatsCards } from './stats-cards';
import { RecentProjects } from './recent-projects';
import { AssignedToMe } from './assigned-to-me';
import { YourTeam } from './your-team';
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
      <div className='flex items-start justify-between flex-wrap gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
          <p className='text-muted-foreground text-sm mt-1'>
            Welcome back! Here&apos;s what&apos;s happening in{' '}
            <span className='font-medium text-primary'>{orgName}</span> today.
          </p>
        </div>

        {/* Date range toggle (static) */}
        <div className='flex items-center rounded-lg border bg-muted/50 p-0.5'>
          <button className='px-3 py-1.5 text-xs font-medium rounded-md bg-background shadow-sm'>
            Last 7 days
          </button>
          <button className='px-3 py-1.5 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground transition-colors'>
            Last 30 days
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={data.stats} />

      {/* 2-column layout: main content + sidebar */}
      <div className='grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6'>
        {/* Left column */}
        <div className='space-y-6 min-w-0'>
          <AssignedToMe issues={data.assignedToMe} />
          <RecentProjects projects={data.recentProjects} orgSlug={orgSlug} />
        </div>

        {/* Right column — Activity + Your Team */}
        <div className='hidden xl:flex flex-col gap-6'>
          <div className='rounded-xl border bg-card shadow-sm overflow-hidden'>
            <ActivityFeedPanel orgId={orgId} />
          </div>
          <YourTeam members={data.teamMembers} />
        </div>
      </div>

      {/* Activity + Team for mobile/tablet (below main content) */}
      <div className='xl:hidden space-y-6'>
        <div className='rounded-xl border bg-card shadow-sm overflow-hidden'>
          <ActivityFeedPanel orgId={orgId} />
        </div>
        <YourTeam members={data.teamMembers} />
      </div>
    </div>
  );
};
