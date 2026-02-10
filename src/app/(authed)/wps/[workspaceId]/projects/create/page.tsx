'use client';

import { getMeQueryOptions } from '@/features/authn/api/actions';
import { ProjectCreateForm } from '@/features/project/ui/forms';
import { useSuspenseQuery } from '@tanstack/react-query';
import { redirect, useParams, usePathname } from 'next/navigation';
import { Suspense } from 'react';

// type CreateProjectHeaderProps = {
//   value: { workspaceId: string; leadId: string };
//   preview?: { name?: string; key?: string; description?: string; iconURL?: string };
// };
const CreateProjectHeader = () => (
  <div className=''>
    <h1 className='text-2xl font-bold'>Create New Project</h1>
    <p className='text-muted-foreground'>Fill in the details below to create a new project.</p>
  </div>
);

export default function Page() {
  const pathname = usePathname();
  const params = useParams<{ workspaceId: string }>();

  const { data: me } = useSuspenseQuery(getMeQueryOptions());

  if (!params) throw new Error('Page must be used within a route with workspaceId param');
  if (!params) throw new Error('workspaceId param is required');
  if (!pathname) throw new Error('pathname is required');

  const handleSuccess = (data: { id: string }) => {
    redirect(`/wps/${params.workspaceId}/projects/${data.id}`);
  };

  return (
    <div className='size-full grid grid-rows-[auto_1fr] gap-6 overflow-hidden'>
      <CreateProjectHeader />
      <div className='overflow-auto'>
        <Suspense fallback={<div>Loading...</div>}>
          <ProjectCreateForm
            value={{ workspaceId: params.workspaceId, leadId: me.id }}
            onSuccess={handleSuccess}
          />
        </Suspense>
      </div>
    </div>
  );
}
