'use client';

import { Suspense } from 'react';

import { cn } from '@/lib/utils';
import { CreateWorkspaceForm } from '@/features/workspaces/ui/forms';
import { WorkspaceSelector } from '@/features/workspaces/ui/selectors';

export default function Page() {
  return (
    <div className='w-screen h-screen flex flex-col items-center justify-center'>
      <div className={cn('w-lg mx-auto', 'flex flex-col items-center gap-2', 'min-h-[70vh]')}>
        <h1 className='text-2xl font-bold'>Workspaces</h1>
        <CreateWorkspaceForm />

        <Suspense fallback={<div>Loading workspaces...</div>}>
          <WorkspaceSelector />
        </Suspense>
      </div>
    </div>
  );
}
