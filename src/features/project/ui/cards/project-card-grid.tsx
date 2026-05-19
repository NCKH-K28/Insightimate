'use client';

import { ProjectItem } from '@/contracts/project';
import { ProjectCard } from './project-card';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderKanban } from 'lucide-react';

interface ProjectCardGridProps {
  projects: ProjectItem[];
  orgSlug: string;
  isLoading?: boolean;
}

export function ProjectCardGrid({ projects, orgSlug, isLoading }: ProjectCardGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border/50">
            <Skeleton className="h-28 w-full rounded-none" />
            <div className="space-y-3 p-4">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex items-center justify-between pt-2">
                <div className="flex -space-x-1.5">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
                <Skeleton className="h-6 w-6 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16">
        <div className="rounded-full bg-primary/10 p-4">
          <FolderKanban className="h-8 w-8 text-primary/60" />
        </div>
        <h3 className="mt-4 text-sm font-medium text-foreground">No projects yet</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Create your first project to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} orgSlug={orgSlug} />
      ))}
    </div>
  );
}
