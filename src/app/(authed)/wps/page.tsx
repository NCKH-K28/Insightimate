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
import { IconComet } from '@tabler/icons-react';

type AppLogoProps = { size?: number; type?: 'icon' | 'label' | 'full' };
const AppLogo = (props: AppLogoProps) => {
  const { size = 32 } = props;
  const IconElement = IconComet;
  return (
    <div className='flex items-center'>
      <IconElement size={size} />
      <span className='ml-2 text-xl font-bold'>Insightmate</span>
    </div>
  );
};

const PageHeader = () => {
  const signOut = useMutation(signoutMutationOptions());

  const handleSignOut = () => {
    signOut.mutate(undefined, { onSuccess: () => redirect('/signin') });
  };

  return (
    <div className='flex items-center justify-between w-full px-4'>
      <AppLogo type='label' />
      <Button size='sm' variant='outline' onClick={handleSignOut} disabled={signOut.isPending}>
        Sign Out
      </Button>
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
          <h1 className='text-2xl font-bold'>Workspaces</h1>
          <CreateWorkspaceForm />

          <Suspense fallback={<div>Loading workspaces...</div>}>
            <WorkspaceSelector />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
