'use client';

import { PropsWithChildren } from 'react';
import { ProjectItem } from '@/contracts/project';
import { ProjectHeaderV3 } from './project-header-v3';

type ProjectDetailLayoutProps = PropsWithChildren<{
  project: ProjectItem;
  orgSlug: string;
}>;

export function ProjectDetailLayout({ project, orgSlug, children }: ProjectDetailLayoutProps) {
  return (
    <div className='size-full grid grid-rows-[auto_1fr] gap-2'>
      <ProjectHeaderV3 project={project} orgSlug={orgSlug} />
      <div className='min-h-0 min-w-0'>{children}</div>
    </div>
  );
}
