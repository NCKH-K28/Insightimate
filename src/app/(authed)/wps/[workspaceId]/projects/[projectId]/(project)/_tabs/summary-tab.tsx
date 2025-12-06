'use client';

import React from 'react';
import StatCard from '@/components/summary/stat-card';
import { useQuery } from '@tanstack/react-query';

import SummaryLoading from '@/components/summary/summary-loading';
import StatusCard from '@/components/summary/status-card';
import PriorityCard from '@/components/summary/priority-card';
import ProjectOverview from '@/components/summary/project-overview';
import QuickStats from '@/components/summary/quick-stats';

import { fetchProjectSummaryQueryOptions } from '@/features/projects/api/actions';

const priorityChartData = [
  { priority: 'lowest', issues: 0 },
  { priority: 'low', issues: 0 },
  { priority: 'medium', issues: 0 },
  { priority: 'high', issues: 0 },
  { priority: 'highest', issues: 0 },
];

export const SummaryTab: React.FC<{
  params: { projectId: string; workspaceId: string; boardId: string };
}> = ({ params }) => {
  const { projectId } = params;

  const { data, isLoading, isError } = useQuery({
    ...fetchProjectSummaryQueryOptions({ projectId }),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const totalIssues = data?.totalIssues || 0;
  const totalToDo = data?.todo || 0;
  const totalInProgress = data?.inProgress || 0;
  const totalDone = data?.done || 0;
  if (isLoading) return <SummaryLoading />;
  if (isError) return <div className='p-4'>Failed to load summary</div>;

  const projectOverview = data?.projectOverview ?? null;
  const workspaceName = projectOverview?.workspace ?? '—';
  const projectLead = projectOverview?.lead ?? '—';
  const startDateRaw = projectOverview?.startDate;
  const startDate = startDateRaw ? new Date(startDateRaw).toISOString().slice(0, 10) : '—';
  const version = projectOverview?.version ?? '—';
  const priorityChartDataFromApi =
    data?.priorityData && Array.isArray(data.priorityData) && data.priorityData.length > 0
      ? data.priorityData.map((p: any) => ({ priority: p.label, issues: p.value }))
      : priorityChartData;
  const maxPriorityValue = Math.max(
    ...priorityChartDataFromApi.map((d: any) => Number(d.issues) || 0),
    1,
  );
  const xDomainMax = Math.max(1, Math.ceil(maxPriorityValue * 1.15));
  const quickStats = data?.quickStats ?? { backlog: 0, bugs: 0, activeSprints: 0 };

  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 items-start'>
      <div className='lg:col-span-2 flex flex-col gap-6'>
        <div className='grid grid-cols-1 sm:grid-cols-4 gap-4'>
          <StatCard title='Total' value={totalIssues} delta='Last 30 days' />
          <StatCard title='To Do' value={totalToDo} delta='Currently open' />
          <StatCard title='In Progress' value={totalInProgress} delta='Active items' />
          <StatCard title='Done' value={totalDone} delta='Closed this month' />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <StatusCard statusData={data?.statusData ?? []} totalIssues={totalIssues} />
          <PriorityCard data={priorityChartDataFromApi} xDomainMax={xDomainMax} />
        </div>
      </div>

      <aside className='lg:col-span-1 flex flex-col gap-6'>
        <ProjectOverview
          workspaceName={workspaceName}
          projectLead={projectLead}
          startDate={startDate}
          version={version}
        />
        <QuickStats quickStats={quickStats} />
      </aside>
    </div>
  );
};

export default SummaryTab;
