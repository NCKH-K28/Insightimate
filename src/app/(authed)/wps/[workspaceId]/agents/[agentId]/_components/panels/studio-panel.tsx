'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { PanelRightIcon } from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import React from 'react';

type AnalyticsData = { id: string; sourceId: string; status: string };

type StudioPanelProps = { params: { agentId: string } };
export const StudioPanel = ({}: StudioPanelProps) => {
  const params = useParams<{ workspaceId: string; agentId: string }>();

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics', 'studio-panel'],
    queryFn: async () => {
      const res = await fetch(`/api/v2/ai/agents/${params.agentId}/analysis`);
      const { data } = await res.json();
      return data as AnalyticsData[];
    },
  });

  return (
    <div
      className={cn(
        'flex h-full flex-col',
        'transition-width duration-300 ease-in-out',
        'border',
        'w-80',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2',
          'px-4 py-1',
          'border-b',
          //
        )}
      >
        <Button variant='ghost' size='icon'>
          <PanelRightIcon size={16} />
        </Button>
        <span className='sr-only'>Open panel</span>
      </div>

      <div>
        <div className='p-4'>
          <h2 className='font-semibold mb-2'>Studio Analytics</h2>
          <div className={cn('flex flex-col gap-2', 'max-h-[400px]', 'overflow-y-auto')}>
            {analyticsData?.map((item) => (
              <div key={item.id} className='p-2 border rounded-md flex flex-col gap-1'>
                <span className='text-sm'>Source ID: {item.id}</span>
                <span className='text-sm'>Status: {item.status}</span>
                <Button
                  size='sm'
                  variant='outline'
                  disabled={item.status !== 'COMPLETED'}
                  role='link'
                >
                  <Link
                    href={`/wps/${params.workspaceId}/agents/${params.agentId}/report/${item.id}`}
                  >
                    View Report
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
