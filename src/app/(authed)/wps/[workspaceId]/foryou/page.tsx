'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { ExternalLink, LayoutGrid, Rocket, Star, Users2 } from 'lucide-react';

import AssignedTab from '@/components/for-you/assigned-tab';
import RecentSpaces from '@/components/for-you/recent-spaces';
import ViewedTab from '@/components/for-you/viewed-tab';
import WorkedTab from '@/components/for-you/worked-tab';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  fetchAssignedItemsQueryOptions,
  fetchViewedItemsQueryOptions,
} from '@/features/foryou/api/actions';

export default function ForYouPage() {
  const params = useParams<{ workspaceId: string }>();
  if (!params) throw new Error('Workspace ID is required');
  const workspaceId = (params as any)?.workspaceId as string | undefined;

  const assignedQuery = useQuery(fetchAssignedItemsQueryOptions(workspaceId));
  const { data: viewedItems = [] } = useQuery(fetchViewedItemsQueryOptions(workspaceId));
  const assignedCount = assignedQuery.data?.length ?? 0;

  return (
    <div className='mx-auto w-full px-6 py-6 md:py-8'>
      <div className='flex items-center justify-between'>
        <div className='text-2xl md:text-3xl font-semibold tracking-tight'>
          <h1 className='text-2xl font-bold'>For you</h1>
          <p className='text-gray-400 text-sm'>
            A personalized view of your recent projects and work items.
          </p>
        </div>
        <Button asChild variant='ghost' size='sm' className='gap-1'>
          <Link href={`/wps/${workspaceId}/projects`}>
            View all spaces <ExternalLink className='h-4 w-4' />
          </Link>
        </Button>
      </div>

      <div className='mt-4 border-t border-slate-200' />

      <section className='mt-6'>
        <div className='flex items-center justify-between'>
          <h2 className='text-sm font-medium text-muted-foreground'>Recent spaces</h2>
        </div>

        <RecentSpaces viewedItems={viewedItems ?? []} workspaceId={workspaceId} />
      </section>

      <section className='mt-8'>
        <Tabs defaultValue='worked' className='w-full'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='worked' className='gap-1 text-xs'>
              <Rocket className='h-4 w-4' /> Worked on
            </TabsTrigger>
            <TabsTrigger value='viewed' className='gap-1 text-xs'>
              <LayoutGrid className='h-4 w-4' /> Viewed
            </TabsTrigger>
            <TabsTrigger value='assigned' className='gap-1 text-xs'>
              <Users2 className='h-4 w-4' /> Assigned to me
              <Badge variant='secondary' className='ml-2 h-5'>
                {assignedCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value='starred' className='gap-1 text-xs'>
              <Star className='h-4 w-4' /> Starred
            </TabsTrigger>
          </TabsList>

          <TabsContent value='worked' className='mt-4'>
            <WorkedTab workspaceId={workspaceId} />
          </TabsContent>

          <TabsContent value='viewed' className='mt-4'>
            <ViewedTab workspaceId={workspaceId} />
          </TabsContent>

          <TabsContent value='assigned' className='mt-4'>
            <AssignedTab workspaceId={workspaceId} />
          </TabsContent>

          {/* <TabsContent value='viewed' className='mt-4'>
            <ViewedTab workspaceId={workspaceId} />
          </TabsContent>

          <TabsContent value='assigned' className='mt-4'>
            <AssignedTab workspaceId={workspaceId} />
          </TabsContent>

          <TabsContent value='starred' className='mt-4'>
            <StarredTab workspaceId={workspaceId} />
          </TabsContent> */}
        </Tabs>
      </section>
    </div>
  );
}
