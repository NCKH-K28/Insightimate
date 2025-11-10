'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { fetchProjectQueryOptions } from '@/features/projects/api/actions';
import { ProjectActions } from '@/features/projects/ui/components/project-actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ProjectHeader = () => {
  const params = useParams<{ projectId: string }>();
  if (!params) throw new Error('Project parameters are missing');

  const { data: project } = useSuspenseQuery(fetchProjectQueryOptions(params));

  return (
    <div className='flex items-center justify-between border-b pb-2'>
      <div className='flex flex-col gap-1'>
        <Avatar className='h-12 w-12'>
          <AvatarImage src={project?.avatar ?? undefined} alt={project.name} />
          <AvatarFallback className='bg-blue-100 text-blue-700 font-semibold'>
            {project.name
              .split(' ')
              .map((word) => word[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
      </div>
      <div>
        <ProjectActions params={params} />
      </div>
    </div>
  );
};

export default ProjectHeader;
