'use client';

import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardIcon, Link2Icon } from '@radix-ui/react-icons';
import { GanttChart, Users2Icon } from 'lucide-react';
import { cn } from '@/lib/utils';

const GanttChartEl = dynamic(() => import('@/components/plan/gantt/gantt-chart'), { ssr: false });

const tabs = {
  overview: {
    labelEl: (
      <span className='flex items-center gap-1'>
        <DashboardIcon />
        Overview
      </span>
    ),
    contentEl: <div>Overview Content</div>,
  },
  timeline: {
    labelEl: (
      <span className='flex items-center gap-1'>
        <GanttChart />
        Timeline
      </span>
    ),
    contentEl: <GanttChartEl />,
  },
  dependencies: {
    labelEl: (
      <span className='flex items-center gap-1'>
        <Link2Icon />
        Dependencies
      </span>
    ),
    contentEl: <div>Dependencies Content</div>,
  },
  teams: {
    labelEl: (
      <span className='flex items-center gap-1'>
        <Users2Icon />
        Teams
      </span>
    ),
    contentEl: <div>Teams Content</div>,
  },
};

const tabArr = Object.entries(tabs);

export default function ScenariosPlanPage() {
  if (!tabArr.length) return null;

  return (
    <Tabs defaultValue={tabArr[0][0]} className='size-full gap-2'>
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
