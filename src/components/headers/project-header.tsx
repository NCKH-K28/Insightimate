'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { fetchProjectQueryOptions } from '@/features/project/api/actions';
import { ProjectActions } from '@/features/project/ui/components/project-actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ActionsMenu } from '../actions-menu';

const ProjectHeaderSkeleton = () => {
  return (
    <div className='flex items-center justify-between border-b pb-2'>
      <Skeleton className='h-12 w-12 rounded' />
      <div className='flex flex-col gap-1 flex-1 mx-4'>
        <Skeleton className='h-6 w-1/3 rounded' />
        <Skeleton className='h-4 w-2/3 rounded' />
      </div>
      <Skeleton className='h-10 w-24 rounded' />
    </div>
  );
};

const ProjectHeader = () => {
  const params = useParams<{ projectId: string }>();
  if (!params) throw new Error('ProjectHeader must be used within a route with projectId param');

  const { data: project, isPending } = useSuspenseQuery(
    fetchProjectQueryOptions({ projId: params.projectId }),
  );

  if (isPending) return <ProjectHeaderSkeleton />;
  if (!project) throw new Error('Project not found');

  return (
    <div className='flex flex-col gap-1'>
      <div className='flex items-center justify-space-between gap-2'>
        <Avatar className='rounded-lg h-12 w-12'>
          <AvatarImage src={project.avatar || undefined} alt={project.name} />
          <AvatarFallback>
            {project.name ? project.name.charAt(0).toUpperCase() : 'P'}
          </AvatarFallback>
        </Avatar>
        <div className='flex flex-col items-start min-w-0 flex-1'>
          <h1 className='text-2xl font-semibold truncate w-full'>{project.name}</h1>
          <p
            className={cn(
              'text-sm text-muted-foreground truncate w-full max-w-lg overflow-hidden',
              {
                italic: !project.description,
              },
            )}
          >
            {project.description || 'No description'}
          </p>
        </div>
        <div className='ml-auto space-x-2 flex items-center'>
          <ProjectActions params={params} />
          <ActionsMenu
            actions={[
              {
                id: 'export-project',
                label: 'Export Project',
                onClick: () => {
                  //TODO: show a proper file save dialog
                  fetch(`/api/v3/projs/${params.projectId}/export`).then((res) => {
                    if (!res.ok) {
                      alert('Failed to export project');
                      return;
                    }
                    res.blob().then((blob) => {
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${project.name}-export.json`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      window.URL.revokeObjectURL(url);
                    });
                  });
                },
              },
            ]}
          />
        </div>
      </div>
      <Separator />
    </div>
  );
};

export default ProjectHeader;
