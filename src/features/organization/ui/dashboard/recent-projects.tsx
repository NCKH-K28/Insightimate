'use client';

import React from 'react';
import Link from 'next/link';
import { FolderKanban, Plus } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

import type { RecentProject } from '@/features/organization/server/dashboard.service';

// ==================== Helpers ====================

const STATUS_COLORS: Record<string, string> = {
  'IN PROGRESS': 'text-blue-600 dark:text-blue-400',
  'NOT STARTED': 'text-slate-500 dark:text-slate-400',
  DONE: 'text-emerald-600 dark:text-emerald-400',
};

const PROGRESS_BAR_COLORS: Record<string, string> = {
  'IN PROGRESS': 'bg-blue-600',
  DONE: 'bg-emerald-500',
  'NOT STARTED': 'bg-slate-300 dark:bg-slate-600',
};

const PROJECT_ICON_STYLES = [
  { bg: 'bg-violet-100 dark:bg-violet-900/50', text: 'text-violet-600 dark:text-violet-400' },
  { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-600 dark:text-blue-400' },
  { bg: 'bg-teal-100 dark:bg-teal-900/50', text: 'text-teal-600 dark:text-teal-400' },
  { bg: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-600 dark:text-amber-400' },
  { bg: 'bg-rose-100 dark:bg-rose-900/50', text: 'text-rose-600 dark:text-rose-400' },
];

// ==================== Component ====================

type RecentProjectsProps = {
  projects: RecentProject[];
  orgSlug: string;
};

export const RecentProjects: React.FC<RecentProjectsProps> = ({ projects, orgSlug }) => {
  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader className='pb-2'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-base font-semibold flex items-center gap-2'>
              <FolderKanban className='size-4 text-muted-foreground' />
              Recent Projects
            </CardTitle>
            <Button size='sm' asChild>
              <Link href={`/o/${orgSlug}/projs`}>
                <Plus className='size-3.5 mr-1' />
                New Project
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className='flex flex-col items-center justify-center py-6 text-center'>
          <FolderKanban className='size-8 text-muted-foreground/30 mb-2' />
          <p className='text-sm font-medium text-muted-foreground'>No projects yet</p>
          <p className='text-xs text-muted-foreground/70 mt-0.5'>
            Create your first project to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base font-semibold flex items-center gap-2'>
            <FolderKanban className='size-4 text-muted-foreground' />
            Recent Projects
          </CardTitle>
          <Button size='sm' asChild>
            <Link href={`/o/${orgSlug}/projs`}>
              <Plus className='size-3.5 mr-1' />
              New Project
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className='pt-1'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          {projects.map((project, idx) => {
            const iconStyle = PROJECT_ICON_STYLES[idx % PROJECT_ICON_STYLES.length];
            const statusColor = STATUS_COLORS[project.statusLabel] ?? STATUS_COLORS['NOT STARTED'];
            const barColor =
              PROGRESS_BAR_COLORS[project.statusLabel] ?? PROGRESS_BAR_COLORS['NOT STARTED'];

            return (
              <Link
                key={project.id}
                href={`/o/${orgSlug}/projs`}
                className='group block rounded-xl border p-4 hover:shadow-md hover:border-primary/20 transition-all duration-200'
              >
                {/* Top: icon + name + status */}
                <div className='flex items-start gap-3'>
                  <div
                    className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${iconStyle.bg}`}
                  >
                    <FolderKanban className={`size-5 ${iconStyle.text}`} />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-semibold truncate group-hover:text-primary transition-colors'>
                      {project.name}
                    </p>
                    <p
                      className={`text-[11px] font-semibold uppercase tracking-wider mt-0.5 ${statusColor}`}
                    >
                      {project.statusLabel}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className='mt-4'>
                  <div className='h-1.5 w-full rounded-full bg-muted overflow-hidden'>
                    <div
                      className={`h-full rounded-full ${barColor} transition-all duration-500`}
                      style={{ width: `${Math.max(project.completionPercent, 3)}%` }}
                    />
                  </div>
                  <div className='flex items-center justify-between mt-2.5'>
                    {/* Avatar stack */}
                    <div className='flex -space-x-1.5'>
                      {project.lead && (
                        <Avatar className='size-6 border-2 border-background'>
                          <AvatarImage src={project.lead.avatar ?? undefined} />
                          <AvatarFallback className='text-[9px] font-medium bg-primary/10 text-primary'>
                            {project.lead.name
                              ?.split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2) ?? '?'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    <span className='text-[11px] text-muted-foreground font-medium'>
                      {project.completionPercent}% complete
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
