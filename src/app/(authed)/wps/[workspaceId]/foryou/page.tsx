'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { ExternalLink, LayoutGrid, Rocket, Star, Users2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  fetchAssignedItemsQueryOptions,
  fetchViewedItemsQueryOptions,
} from '@/features/foryou/api/actions';
import { Separator } from '@/components/ui/separator';
import {
  WorkedTab,
  ViewedTab,
  AssignedTab,
  RecentSpaces,
} from '@/features/workspaces/ui/components/for-you';

type ForYouHeaderProps = { workspaceId: string };
const ForYouHeader = ({ workspaceId }: ForYouHeaderProps) => {
  return (
    <div className='flex items-center justify-between'>
      <div id='projects-header' className={'w-full flex flex-col gap-2'}>
        <h1 className='text-2xl font-semibold'>For You</h1>
        <span className='text-sm text-muted-foreground'>
          Personalized space activity and recommendations.
        </span>
      </div>

      <Button asChild variant='link' size='sm'>
        <Link href={`/wps/${workspaceId}/projects`} className='flex items-center gap-1 text-sm'>
          View All Projects
          <ExternalLink className='h-4 w-4' />
        </Link>
      </Button>
    </div>
  );
};

type RecentSpacesSectionProps = { params: { workspaceId: string } };
const RecentSpacesSection = ({ params }: RecentSpacesSectionProps) => {
  const { workspaceId } = params;
  const { data: viewedItems = [] } = useQuery(fetchViewedItemsQueryOptions(workspaceId));
  return (
    <section className='mt-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-sm font-medium text-muted-foreground'>Recent spaces</h2>
      </div>

      <RecentSpaces viewedItems={viewedItems ?? []} workspaceId={workspaceId} />
    </section>
  );
};

export default function ForYouPage() {
  const params = useParams<{ workspaceId: string }>();
  if (!params) throw new Error('Workspace ID is required');
  const { workspaceId } = params;

  const assignedQuery = useQuery(fetchAssignedItemsQueryOptions(workspaceId));
  const assignedCount = assignedQuery.data?.length ?? 0;

  return (
    <div className='mx-auto w-full flex flex-col gap-2'>
      <ForYouHeader workspaceId={workspaceId} />

      <Separator />

      <RecentSpacesSection params={params} />

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
