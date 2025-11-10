'use client';

import { CurrentSprintPanel } from '@/features/projects/ui/summary/current-sprint-panel';
import { RecentIssuesList } from '@/features/projects/ui/summary/recent-issues-list';
import { WorkloadList } from '@/features/projects/ui/summary/workload-list';
import { baseApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IssueStatList } from '@/features/projects/ui/summary/issue-stats-list';
import { useMemo } from 'react';
import { IssueDistribution } from '@/features/projects/ui/summary/issue-distribution';

interface ProjectSummaryData {
  project: {
    id: string;
    name: string;
    key: string;
    avatar?: string;
    lead?: { id: string; name: string; avatar?: string };
  };
  stats: {
    doneIssues: number;
    inProgressIssues: number;
    openIssues: number;
    overdueIssues: number;
    storyPoints: { completed: number; total: number };
    totalIssues: number;
    unassignedIssues: number;
  };
  distribution: {
    byStatus: Array<{ id: string; name: string; count: number; color?: string; category?: string }>;
    byType: Array<{ id: string; name: string; count: number; color?: string; category?: string }>;
    byPriority: Array<{
      id: string;
      name: string;
      count: number;
      color?: string;
      category?: string;
    }>;
  };
  currentSprint?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    totalIssues: number;
    completedIssues: number;
    storyPoints: { completed: number; total: number };
  };
  workload: Array<{
    assignee?: { id: string; name: string; avatar?: string };
    openIssues: number;
  }>;
  recentIssues: Array<{
    key: string;
    summary: string;
    status: { name: string; color: string };
    assignee?: { name: string; avatar?: string };
    createdAt: string;
    type: string;
  }>;
}

interface ProjectSummaryTabProps {
  params: { workspaceId: string; projectId: string };
}

function LoadingSkeleton() {
  return (
    <div className='space-y-8'>
      {/* Header Skeleton */}
      <div className='space-y-4'>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-4 w-96' />
      </div>

      {/* Stats Skeleton */}
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className='h-24 w-full' />
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
        <div className='xl:col-span-2 space-y-6'>
          <Skeleton className='h-80 w-full' />
          <Skeleton className='h-96 w-full' />
        </div>
        <div className='space-y-6'>
          <Skeleton className='h-80 w-full' />
          <Skeleton className='h-60 w-full' />
        </div>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className='flex items-center justify-center min-h-[400px]'>
      <Alert className='max-w-md'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          Unable to load project summary. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export function SummaryTab({ params }: ProjectSummaryTabProps) {
  const { data, isPending, error } = useQuery({
    queryKey: ['projectSummary', params.projectId],
    queryFn: async (): Promise<ProjectSummaryData> => {
      const { data } = await baseApi.get<{ data: ProjectSummaryData }>(
        `v2/projects/${params.projectId}/summary`,
      );
      return data;
    },
  });

  const stats = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Total Issues', stat: data.stats.totalIssues },
      { name: 'In Progress Issues', stat: data.stats.inProgressIssues },
      { name: 'Done Issues', stat: data.stats.doneIssues },
      { name: 'Overdue Issues', stat: data.stats.overdueIssues },
    ];
  }, [data]);

  const distributions = useMemo(() => {
    if (!data) return { status: [], type: [], priority: [] };
    return {
      status: data.distribution.byStatus,
      type: data.distribution.byType,
      priority: data.distribution.byPriority,
    };
  }, [data]);

  if (isPending) return <LoadingSkeleton />;
  if (error || !data) return <ErrorState />;

  return (
    <div className='size-full overflow-y-auto'>
      <div className='size-full mx-auto max-w-7xl'>
        <div className='space-y-8'>
          <section>
            <IssueStatList stats={stats} />
          </section>

          {/* Main Dashboard Grid */}
          <section className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
            <div className='xl:col-span-2 space-y-8'>
              <IssueDistribution distributions={distributions} />

              <RecentIssuesList issues={data.recentIssues} />
            </div>

            <div className='space-y-8'>
              {data.currentSprint && (
                <div className='bg-background rounded-lg border shadow-sm'>
                  <CurrentSprintPanel sprint={data.currentSprint} />
                </div>
              )}

              <WorkloadList workload={data.workload} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
