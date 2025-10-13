'use client';

import { ProjectCreateForm } from '@/features/projects/ui/forms';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';

const CreateProjectHeader = () => (
  <div className=''>
    <h1 className='text-2xl font-bold'>Create New Project</h1>
    <p className='text-muted-foreground'>Fill in the details below to create a new project.</p>
  </div>
);

export default function Page() {
  const params = useParams<{ workspaceId: string }>();
  if (!params.workspaceId) return null;

  return (
    <div className='size-full grid grid-rows-[auto_1fr] gap-6 overflow-hidden'>
      <CreateProjectHeader />
      <div className='overflow-auto'>
        <Suspense fallback={<div>Loading...</div>}>
          <ProjectCreateForm workspaceId={params.workspaceId} />
        </Suspense>
      </div>
    </div>
  );
}
