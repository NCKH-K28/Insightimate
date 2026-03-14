'use client';

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { getProjectQueryOptions } from '@/features/project/api/actions';
import { ActivityFeedPanel } from '@/features/activity/ui/activity-feed-panel';

import {
  SummaryTab,
  BacklogTab,
  KanbanTab,
  ListTab,
  GanttTab,
  CalendarTab,
} from '@/features/project_v3/ui/tabs';

// ---------- Wrapper ----------

type TabParams = { boardId: string; projId: string };
type WrapperProps = { projId: string; Component: React.ComponentType<{ params: TabParams }> };

const Wrapper = React.memo(
  function Wrapper({ projId, Component }: WrapperProps) {
    const { data: project, isPending } = useQuery(getProjectQueryOptions({ projId }));

    if (isPending) return <div className='p-4 text-muted-foreground'>Loading…</div>;
    if (!project) return <div className='p-4 text-destructive'>Project not found</div>;

    const boardId = project.boardId;
    if (!boardId) return <div className='p-4 text-muted-foreground'>Board not found</div>;

    return <Component params={{ boardId, projId }} />;
  },
  (prev, next) => prev.projId === next.projId && prev.Component === next.Component,
);

// ---------- Tabs config ----------

const makeTabs = (projId: string, orgId: string) => ({
  summary: {
    label: 'Summary',
    content: <Wrapper projId={projId} Component={SummaryTab} />,
  },
  backlog: {
    label: 'Backlog',
    content: <Wrapper projId={projId} Component={BacklogTab} />,
  },
  board: {
    label: 'Kanban',
    content: <Wrapper projId={projId} Component={KanbanTab} />,
  },
  list: {
    label: 'List',
    content: <Wrapper projId={projId} Component={ListTab} />,
  },
  gantt: {
    label: 'Gantt',
    content: <Wrapper projId={projId} Component={GanttTab} />,
  },
  calendar: {
    label: 'Calendar',
    content: <Wrapper projId={projId} Component={CalendarTab} />,
  },
  activity: {
    label: 'Activity',
    content: orgId ? (
      <ActivityFeedPanel orgId={orgId} projectId={projId} />
    ) : (
      <div className='p-4 text-muted-foreground'>Loading…</div>
    ),
  },
});

// ---------- ProjectTabs ----------

type ProjectTabsProps = { projId: string };

export function ProjectTabs({ projId }: ProjectTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Fetch orgId from the project to pass to the Activity tab
  const { data: project } = useQuery(getProjectQueryOptions({ projId }));
  const orgId = (project as any)?.orgId as string | undefined;

  const tabs = React.useMemo(() => makeTabs(projId, orgId ?? ''), [projId, orgId]);
  const tabArr = React.useMemo(() => Object.entries(tabs), [tabs]);

  const currentTab = searchParams?.get('tab') || tabArr[0][0];

  const handleChangeTab = React.useCallback(
    (newTab: string) => {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', newTab);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router],
  );

  return (
    <Tabs defaultValue={currentTab} className='size-full gap-2' onValueChange={handleChangeTab}>
      <TabsList className='gap-2'>
        {tabArr.map(([key, { label }]) => (
          <TabsTrigger key={key} value={key} className='capitalize'>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className='flex-1 relative'>
        <div className='absolute inset-0'>
          {tabArr.map(([key, { content }]) => (
            <TabsContent
              key={key}
              value={key}
              className={cn('size-full p-2 overflow-auto', 'border rounded-md shadow-xs')}
            >
              {content}
            </TabsContent>
          ))}
        </div>
      </div>
    </Tabs>
  );
}
