'use client';

import { Suspense } from 'react';

import { cn } from '@/lib/utils';
import { CreateWorkspaceForm } from '@/features/workspaces/ui/forms';
import { WorkspaceSelector } from '@/features/workspaces/ui/selectors';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { signoutMutationOptions } from '@/features/authn/api/actions';
import { redirect } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { InsightmateLogoFull } from '@/components/icons/insightmate';
import Link from 'next/link';

const AppLogo = () => {
  return (
    <Link href='/'>
      <InsightmateLogoFull height={40} />
      <span className='sr-only'>Insightmate</span>
    </Link>
  );
};

const PageHeader = () => {
  const signOut = useMutation(signoutMutationOptions());

  const handleSignOut = () => {
    signOut.mutate(undefined, { onSuccess: () => redirect('/signin') });
  };

  return (
    <div className='flex items-center justify-between w-full px-4'>
      <AppLogo />
      <Button size='sm' variant='outline' onClick={handleSignOut} disabled={signOut.isPending}>
        Sign Out
      </Button>
    </div>
  );
};

const LoadingWorkspaces = () => {
  return (
    <div className='w-full flex flex-col items-center'>
      <Skeleton className='h-6 w-3/4 mb-4' />
      <Skeleton className='h-10 w-full mb-2' />
      <Skeleton className='h-10 w-full mb-2' />
      <Skeleton className='h-10 w-full mb-2' />
    </div>
  );
};

export default function Page() {
  return (
    <div className='w-screen h-screen flex flex-col'>
      <div className='w-full py-4'>
        <PageHeader />
      </div>
      <Separator />

      <div className='size-full flex flex-col items-center justify-center py-2'>
        <div className={cn('w-lg mx-auto', 'flex flex-col items-center gap-2', 'min-h-[70vh]')}>
          <Suspense fallback={<LoadingWorkspaces />}>
            <h1 className='text-2xl font-bold'>Workspaces</h1>
            <CreateWorkspaceForm />

            <WorkspaceSelector />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
