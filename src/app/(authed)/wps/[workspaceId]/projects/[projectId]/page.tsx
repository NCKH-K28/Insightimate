'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { cn } from '@/lib/utils';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getProjectQueryOptions } from '@/features/projects/api/actions';
import { BacklogTab, KanbanTab, ListTab, GranttTab } from './_tabs';

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
    contentEl: <div>Summary Page</div>,
  },
  backlog: {
    labelEl: 'Backlog',
    contentEl: <Wrapper Component={BacklogTab} />,
  },
  board: {
    labelEl: 'Board',
    contentEl: <Wrapper Component={KanbanTab} />,
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
    contentEl: <div>Calendar Page</div>,
  },
};

const tabArr = Object.entries(tabs);

export default function ProjectWithViewModePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
              className={cn('size-full overflow-hidden p-2', 'border rounded-md shadow-xs')}
            >
              {contentEl}
            </TabsContent>
          ))}
        </div>
      </div>
    </Tabs>
  );
}
