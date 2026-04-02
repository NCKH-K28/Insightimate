'use client';

import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { useSuspenseQuery, useQuery } from '@tanstack/react-query';
import { List, LayoutGrid, BarChart3, Activity } from 'lucide-react';
import { getOrgQueryOptions } from '@/features/organization/api/actions';

import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import SprintHeader from './components/sprint-header';
import {
  sprintDetailQueryOptions,
  sprintIssuesQueryOptions,
} from '@/features/sprints/api/actions';

import SprintSummaryTab from './tabs/summary-tab';
import KanbanTabV3 from './tabs/kanban-tab';
import ListTab from './tabs/list-tab';
import { ActivityFeed } from '@/features/activity/ui/activity-feed';

type ValidTab = 'issues' | 'charts' | 'activity';
const VALID_TABS: ValidTab[] = ['issues', 'charts', 'activity'];

function isValidTab(tab: string | null): tab is ValidTab {
  return tab !== null && VALID_TABS.includes(tab as ValidTab);
}

// ── Loading Skeletons ─────────────────────────────────────────────────
function TabContentSkeleton() {
  return (
    <div className='space-y-3 p-4'>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className='h-12 w-full' />
      ))}
    </div>
  );
}

// ── Issues Tab ────────────────────────────────────────────────────────
function IssuesTabContent({
  params,
}: {
  params: { orgSlug: string; sprintId: string };
}) {
  const { data: sprint } = useSuspenseQuery(sprintDetailQueryOptions(params.sprintId));
  const { data: issues } = useQuery(sprintIssuesQueryOptions(params.sprintId));

  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  return (
    <div className='flex flex-col gap-2'>
      {/* View Mode Switcher */}
      <div className='flex items-center justify-end px-1'>
        <ToggleGroup
          type='single'
          value={viewMode}
          onValueChange={(val) => {
            if (val === 'list' || val === 'board') setViewMode(val);
          }}
          size='sm'
        >
          <ToggleGroupItem value='list' aria-label='List view'>
            <List className='h-4 w-4' />
          </ToggleGroupItem>
          <ToggleGroupItem value='board' aria-label='Board view'>
            <LayoutGrid className='h-4 w-4' />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* View Content */}
      {viewMode === 'list' ? (
        <ListTab sprint={sprint as any} issues={issues ?? []} />
      ) : (
        <div className='flex-1 overflow-auto'>
          <KanbanTabV3
            params={{
              orgSlug: params.orgSlug,
              boardId: sprint.boardId,
              projectId: (sprint as any).projectId ?? sprint.boardId,
            }}
            issues={issues ?? []}
          />
        </div>
      )}
    </div>
  );
}

// ── Charts Tab ────────────────────────────────────────────────────────
function ChartsTabContent({
  params,
}: {
  params: { orgSlug: string; sprintId: string };
}) {
  const { data: sprint } = useSuspenseQuery(sprintDetailQueryOptions(params.sprintId));

  return <SprintSummaryTab sprint={sprint as any} />;
}

// ── Activity Tab ──────────────────────────────────────────────────────
function ActivityTabContent({
  params,
}: {
  params: { orgSlug: string; sprintId: string };
}) {
  const { data: org } = useQuery(getOrgQueryOptions({ id: params.orgSlug, by: 'slug' }));
  const orgId = (org as any)?.id as string | undefined;

  if (!orgId) {
    return (
      <div className='flex items-center justify-center py-12 text-sm text-muted-foreground'>
        Loading activity feed…
      </div>
    );
  }

  return (
    <div className='max-w-3xl mx-auto'>
      <ActivityFeed
        params={{ orgId, entity: 'SPRINT', entityId: params.sprintId, limit: 25 }}
        showProject={false}
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function SprintPage() {
  const searchParams = useSearchParams();
  if (!searchParams) throw new Error('Search params are undefined');
  const params = useParams<{ orgSlug: string; sprintId: string }>();
  if (!params) throw new Error('Params are undefined');
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState<ValidTab>(() => {
    const tab = searchParams.get('tab');
    return isValidTab(tab) ? tab : 'issues';
  });

  const handleTabChange = (tab: string) => {
    if (!isValidTab(tab)) return;
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('tab', tab);
    router.replace(`${pathname}?${sp.toString()}`);
    setActiveTab(tab);
  };

  return (
    <TooltipProvider>
      <div className='flex flex-col gap-2'>
        <SprintHeader params={params} />
        <Separator />

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className='flex-1 flex flex-col'
        >
          <TabsList>
            <TabsTrigger value='issues'>
              <List className='h-4 w-4' />
              <span className='hidden sm:inline'>Issues</span>
            </TabsTrigger>
            <TabsTrigger value='charts'>
              <BarChart3 className='h-4 w-4' />
              <span className='hidden sm:inline'>Charts</span>
            </TabsTrigger>
            <TabsTrigger value='activity'>
              <Activity className='h-4 w-4' />
              <span className='hidden sm:inline'>Activity</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value='issues' className='flex-1 flex flex-col'>
            <Suspense fallback={<TabContentSkeleton />}>
              <IssuesTabContent params={params} />
            </Suspense>
          </TabsContent>

          <TabsContent value='charts' className='flex-1'>
            <Suspense fallback={<TabContentSkeleton />}>
              <ChartsTabContent params={params} />
            </Suspense>
          </TabsContent>

          <TabsContent value='activity' className='flex-1'>
            <Suspense fallback={<TabContentSkeleton />}>
              <ActivityTabContent params={params} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
