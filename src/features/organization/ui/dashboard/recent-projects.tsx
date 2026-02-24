'use client';

import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { FolderKanban, ArrowRight, Hash } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { RecentProject } from '@/features/organization/server/dashboard.service';

// ==================== Component ====================

type RecentProjectsProps = {
  projects: RecentProject[];
  orgSlug: string;
};

export const RecentProjects: React.FC<RecentProjectsProps> = ({ projects, orgSlug }) => {
  if (projects.length === 0) {
    return (
      <Card className='border-dashed'>
        <CardContent className='flex flex-col items-center justify-center py-10 text-center'>
          <FolderKanban className='size-10 text-muted-foreground/40 mb-3' />
          <p className='text-sm font-medium text-muted-foreground'>No projects yet</p>
          <p className='text-xs text-muted-foreground/70 mt-1'>
            Create your first project to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base font-semibold flex items-center gap-2'>
            <FolderKanban className='size-4 text-muted-foreground' />
            Recent Projects
          </CardTitle>
          <Button variant='ghost' size='sm' className='text-xs' asChild>
            <Link href={`/o/${orgSlug}/projs`}>
              View all
              <ArrowRight className='size-3 ml-1' />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='grid gap-3'>
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/o/${orgSlug}/projs`}
              className='group flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors duration-150'
            >
              {/* Project avatar / key */}
              <div className='size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0'>
                <span className='text-xs font-bold text-primary'>{project.key.slice(0, 3)}</span>
              </div>

              {/* Info */}
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium truncate group-hover:text-primary transition-colors'>
                    {project.name}
                  </span>
                  <Badge variant='outline' className='text-[10px] px-1.5 py-0 shrink-0'>
                    <Hash className='size-2.5 mr-0.5' />
                    {project.key}
                  </Badge>
                </div>
                <div className='flex items-center gap-2 mt-1'>
                  {project.lead && (
                    <div className='flex items-center gap-1'>
                      <Avatar className='size-4'>
                        <AvatarImage src={project.lead.avatar ?? undefined} />
                        <AvatarFallback className='text-[8px]'>
                          {project.lead.name?.charAt(0) ?? '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className='text-[11px] text-muted-foreground'>{project.lead.name}</span>
                    </div>
                  )}
                  <span className='text-[11px] text-muted-foreground/60'>•</span>
                  <span className='text-[11px] text-muted-foreground/60'>
                    {project._issueCount} issues
                  </span>
                  <span className='text-[11px] text-muted-foreground/60'>•</span>
                  <span className='text-[11px] text-muted-foreground/60'>
                    {formatDistanceToNow(new Date(project.updatedAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>

              <ArrowRight className='size-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0' />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
