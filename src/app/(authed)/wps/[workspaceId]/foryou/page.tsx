'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ChevronDown,
  ExternalLink,
  LayoutGrid,
  SquareStack,
  KanbanSquare,
  CheckSquare,
  Dot,
  Star,
  Users2,
  Rocket,
  FolderKanban,
} from 'lucide-react';

/**
 * Jira "For you" inspired page
 * - Recent spaces: grid of project cards
 * - Work streams with tabs and a Today list
 *
 * Replace the mocked data with your own fetcher.
 */

// -------------------- Mock Data --------------------
const recentSpaces = [
  {
    id: 'np',
    name: 'NCKH prj',
    type: 'Team-managed software',
    color: 'bg-sky-400',
    openItems: 0,
    doneItems: 0,
    boards: 1,
  },
  {
    id: 'test',
    name: 'test project',
    type: 'Team-managed software',
    color: 'bg-violet-500',
    openItems: 0,
    doneItems: 0,
    boards: 1,
  },
];

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

// -------------------- UI Primitives --------------------
function ProjectCard({
  name,
  type,
  color,
  openItems,
  doneItems,
  boards,
}: {
  name: string;
  type: string;
  color: string; // tailwind bg-*
  openItems: number;
  doneItems: number;
  boards: number;
}) {
  return (
    <Card className='relative overflow-hidden group border-muted/60 hover:border-muted transition-colors p-2'>
      {/* Color stripe */}
      <div className={`absolute left-0 top-0 h-full w-1 ${color}`} />

      <CardHeader className='pb-0.5'>
        <div className='flex items-center gap-1.5'>
          <Avatar className='h-5 w-5 shadow-sm'>
            <AvatarFallback className='text-[10px]'>
              {name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0'>
            <h3 className='text-sm font-medium leading-tight truncate'>{name}</h3>
            <p className='text-[11px] text-muted-foreground truncate'>{type}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-0.5'>
        <div>
          <p className='text-[11px] font-medium text-muted-foreground'>Quick links</p>
          <div className='mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1'>
            <QuickLink label='My open work items' count={openItems} />
            <QuickLink label='Done work items' count={doneItems} />
          </div>
        </div>
      </CardContent>

      <CardFooter className='flex items-center justify-between pt-0'>
        <div className='text-[11px] text-muted-foreground flex items-center gap-1'>
          <FolderKanban className='h-3 w-3' />
          <span className='text-[11px]'>
            {boards} board{boards !== 1 ? 's' : ''}
          </span>
          <ChevronDown className='h-3 w-3' />
        </div>
        <Button variant='ghost' size='sm' className='h-6 px-2 text-xs'>
          Open <ExternalLink className='ml-1 h-3 w-3' />
        </Button>
      </CardFooter>
    </Card>
  );
}

function QuickLink({ label, count }: { label: string; count?: number }) {
  return (
    <button className='flex items-center justify-between rounded-xl border bg-card px-3 py-2 text-left text-sm hover:bg-accent/40'>
      <span className='truncate'>{label}</span>
      <Badge variant='secondary' className='ml-2'>
        {count ?? 0}
      </Badge>
    </button>
  );
}

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

// -------------------- Page --------------------
export default function MyWorkPage() {
  const assignedCount = 0; // replace with real data

  const today = useMemo(() => todayItems, []);

  return (
    <div className='mx-auto w-full px-6 py-6 md:py-8'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        {/* <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">For you</h1> */}
        <div className='text-2xl md:text-3xl font-semibold tracking-tight'>
          <h1 className='text-2xl font-bold'>For you</h1>
          <p className='text-gray-400 text-sm'>A personalized view of your recent projects, boards, and work items.</p>
        </div>
        <Button asChild variant='ghost' size='sm' className='gap-1'>
          <Link href='#'>
            View all spaces <ExternalLink className='h-4 w-4' />
          </Link>
        </Button>
      </div>

      {/* divider under title */}
      <div className='mt-4 border-t border-slate-200' />

      {/* Recent spaces */}
      <section className='mt-6'>
        <div className='flex items-center justify-between'>
          <h2 className='text-sm font-medium text-muted-foreground'>Recent spaces</h2>
        </div>

        <div className='mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2'>
          {recentSpaces.map((p) => (
            <ProjectCard
              key={p.id}
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

      {/* Work filters */}
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
