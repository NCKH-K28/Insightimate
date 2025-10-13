'use client';

import { PropsWithChildren } from 'react';
import ProjectHeader from '@/components/headers/project-header';

export function ProjectLayout({ children }: PropsWithChildren) {
  return (
    <div className='size-full grid grid-rows-[auto_1fr] gap-2'>
      <ProjectHeader />
      <div className='min-h-0 min-w-0'>{children}</div>
    </div>
  );
}

// export default dynamic(() => Promise.resolve(ProjectLayout), { ssr: false });
export default ProjectLayout;
