'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRecentProjectsQueryOptions } from '@/features/projects/api/actions';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink,
  LayoutGrid,
  SquareStack,
  KanbanSquare,
  CheckSquare,
  Star,
  Users2,
  Rocket,
  FolderKanban,
} from 'lucide-react';

import ProjectCard from '@/components/for-you/project-card';

const todayItems = [
  {
    id: 'np-board',
    icon: KanbanSquare,
    title: 'NP board',
    meta: 'Board · NCKH prj',
    checked: false,
  },
  {
    id: 'nckh',
    icon: SquareStack,
    title: 'NCKH prj',
    meta: 'Team-managed software',
    checked: false,
  },
  {
    id: 'aaa',
    icon: CheckSquare,
    title: 'aaaa',
    meta: 'NP-1 · NCKH prj',
    checked: true,
  },
  {
    id: 'mba',
    icon: KanbanSquare,
    title: 'MBA board',
    meta: 'Board · test project',
    checked: false,
  },
  {
    id: 'test',
    icon: SquareStack,
    title: 'test project',
    meta: 'Team-managed software',
    checked: false,
  },
];

function TodayRow({
  title,
  meta,
  checked,
  Icon,
}: {
  title: string;
  meta: string;
  checked?: boolean;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className='flex items-start gap-3 rounded-xl border p-3 hover:bg-accent/30'>
      <Icon className='mt-0.5 h-5 w-5 text-muted-foreground' />
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2'>
          <p className='font-medium leading-none truncate'>{title}</p>
          {checked && (
            <Badge variant='outline' className='h-5'>
              Done
            </Badge>
          )}
        </div>
        <p className='text-xs text-muted-foreground mt-1 truncate'>{meta}</p>
      </div>
    </div>
  );
}

export default function MyWorkPage() {
  const assignedCount = 0; 

  const today = useMemo(() => todayItems, []);

  const fetchRecent = useQuery(fetchRecentProjectsQueryOptions());
  const recentSpaces = fetchRecent.data ?? [];
  const params = useParams();
  const workspaceId = (params as any)?.workspaceId as string | undefined;

  return (
    <div className='mx-auto w-full px-6 py-6 md:py-8'>
      <div className='flex items-center justify-between'>
        <div className='text-2xl md:text-3xl font-semibold tracking-tight'>
          <h1 className='text-2xl font-bold'>For you</h1>
          <p className='text-gray-400 text-sm'>
            A personalized view of your recent projects, boards, and work items.
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

        <div className='mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2'>
          {recentSpaces.map((p: any) => (
            <ProjectCard
              key={p.id}
              id={p.id}
              workspaceId={workspaceId}
              avatar={p.avatar}
              name={p.name}
              type={p.type}
              color={p.color}
              openItems={p.openItems}
              doneItems={p.doneItems}
              boards={p.boards}
            />
          ))}
        </div>
      </section>

      <section className='mt-8'>
        <Tabs defaultValue='viewed' className='w-full'>
          <TabsList className='grid w-full grid-cols-5'>
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
            <TabsTrigger value='boards' className='gap-1 text-xs'>
              <FolderKanban className='h-4 w-4' /> Boards
            </TabsTrigger>
          </TabsList>

          {/* Today list for the active tab */}
          <TabsContent value='viewed' className='mt-4'>
            <h3 className='text-xs font-semibold text-muted-foreground tracking-wide'>TODAY</h3>
            <div className='mt-2 space-y-2'>
              {today.map((row) => (
                <TodayRow
                  key={row.id}
                  title={row.title}
                  meta={row.meta}
                  checked={row.checked}
                  Icon={row.icon}
                />
              ))}
            </div>

            <div className='mt-6 text-sm text-muted-foreground'>
              Couldn’t find your work item?
              <Link href='#' className='font-medium underline underline-offset-4'>
                View all work items
              </Link>
            </div>
          </TabsContent>

          {/* You can replicate the same content in other tabs or fetch different data per tab */}
          <TabsContent value='worked' className='mt-4'>
            <EmptyState label='You haven’t worked on anything recently.' />
          </TabsContent>
          <TabsContent value='assigned' className='mt-4'>
            <EmptyState label='No items assigned to you.' />
          </TabsContent>
          <TabsContent value='starred' className='mt-4'>
            <EmptyState label='No starred items yet.' />
          </TabsContent>
          <TabsContent value='boards' className='mt-4'>
            <EmptyState label='No boards to show.' />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className='flex items-center justify-center rounded-xl border bg-muted/30 py-12 text-sm text-muted-foreground'>
      {label}
    </div>
  );
}
