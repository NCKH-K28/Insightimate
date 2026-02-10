'use client';

import React, { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { cn } from '@/lib/utils';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getProjectQueryOptions } from '@/features/project/api/actions';
import { viewItem } from '@/features/foryou/api/actions';
import { BacklogTab, ListTab, GranttTab, CalendarTab, SummaryTab, KanbanTabV3 } from './_tabs';

type WrapperParams = { boardId: string; projectId: string; workspaceId: string };
type WrapperProps = { Component: React.ComponentType<{ params: WrapperParams }> };
const Wrapper = React.memo(
  function Wrapper({ Component }: WrapperProps) {
    const params = useParams<{ projectId: string; workspaceId: string; boardId: string }>();
    if (!params) throw new Error('Params not found');

    const { data: project, isPending } = useQuery(getProjectQueryOptions(params));
    if (isPending) return <div>Loading...</div>;
    if (!project) return <div>Project not found</div>;
    const boardId = project.boardId;
    if (!boardId) return <div>Board not found</div>;
    return (
      <Component
        params={{ boardId, projectId: params.projectId, workspaceId: params.workspaceId }}
      />
    );
  },
  (prev, next) => {
    return prev.Component === next.Component;
  },
);

const tabs = {
  summary: {
    labelEl: 'Summary',
    contentEl: <Wrapper Component={SummaryTab} />,
  },
  backlog: {
    labelEl: 'Backlog',
    contentEl: <Wrapper Component={BacklogTab} />,
  },
  board: {
    labelEl: 'Kanban',
    contentEl: <Wrapper Component={KanbanTabV3} />,
  },
  list: {
    labelEl: 'List',
    contentEl: <Wrapper Component={ListTab} />,
  },
  grantt: {
    labelEl: 'Grantt',
    contentEl: <Wrapper Component={GranttTab} />,
  },
  calendar: {
    labelEl: 'Calendar',
    contentEl: <Wrapper Component={CalendarTab} />,
  },
};

const tabArr = Object.entries(tabs);

export default function ProjectWithViewModePage() {
  const params = useParams<{ projectId: string; workspaceId: string }>();
  if (!params) throw new Error('Params not found');

  const { data: projectForView } = useQuery(
    getProjectQueryOptions({ projectId: params.projectId }),
  );

  useEffect(() => {
    if (!projectForView?.id) return;
    viewItem(params.workspaceId, {
      type: 'PROJECT',
      entityId: projectForView.id,
      context: { boardId: projectForView.boardId },
    }).catch(() => {});
  }, [params.workspaceId, projectForView]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!searchParams) throw new Error('Search params not found');

  const tab = searchParams.get('tab') || tabArr[0][0];

  const handleChangeTab = React.useCallback(
    (newTab: string) => {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('tab', newTab);
      const search = searchParams.toString();
      const href = `${pathname}?${search}`;
      router.push(href);
    },
    [pathname, router],
  );

  return (
    <Tabs defaultValue={tab} className='size-full gap-2' onValueChange={handleChangeTab}>
      <TabsList className='gap-2'>
        {tabArr.map(([key, { labelEl }]) => (
          <TabsTrigger key={key} value={key} className='capitalize'>
            {labelEl}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className='flex-1 relative'>
        <div className='absolute inset-0'>
          {tabArr.map(([key, { contentEl }]) => (
            <TabsContent
              key={key}
              value={key}
              className={cn('size-full p-2 overflow-auto', 'border rounded-md shadow-xs')}
            >
              {contentEl}
            </TabsContent>
          ))}
        </div>
      </div>
    </Tabs>
  );
}
