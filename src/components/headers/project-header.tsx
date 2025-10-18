'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { fetchProjectQueryOptions } from '@/features/projects/api/actions';
import { ProjectActions } from '@/features/projects/ui/components/project-actions';
import { DottedSeparator } from '../dotted-separator';

const ProjectHeader = () => {
  const params = useParams<{ projectId: string }>();

  const { data: project } = useSuspenseQuery(fetchProjectQueryOptions(params));

  return (
    <div className='flex items-center justify-between border-b pb-2'>
      <div className='flex flex-col gap-1'>
        <h1 className='text-2xl font-semibold'>{project?.name || 'Project'}</h1>
        <div className='text-sm text-muted-foreground'>{project?.description}</div>
      </div>
      <div>
        <ProjectActions params={params} />
      </div>
    </div>
  );
};

export default ProjectHeader;
