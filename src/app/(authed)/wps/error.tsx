'use client';

import { useEffect, useMemo } from 'react';
import get from 'lodash/get';
import { Button } from '@/components/ui/button';
import { redirect } from 'next/navigation';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error }: ErrorProps) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error);
  }, [error]);

  const reset = () => window.location.reload();

  const errorMessage = useMemo(() => {
    const msg = get(error, 'response.data.error', get(error, 'message', 'Unknown error'));
    return msg;
  }, [error]);

  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-4'>
      <div className='flex w-full max-w-md flex-col items-center rounded-lg border p-6 shadow'>
        <h2 className='text-2xl font-bold'>{errorMessage}</h2>

        <p className='mt-2 text-sm text-muted-foreground'>
          Please try again later or contact support if the issue persists.
        </p>

        <div className='flex flex-row gap-4'>
          <Button
            className='mt-4'
            size='sm'
            onClick={() => {
              reset();
            }}
          >
            Retry
          </Button>

          <Button
            className='mt-4'
            variant='outline'
            onClick={() => {
              redirect('/wps');
            }}
          >
            To Workspaces
          </Button>
        </div>
      </div>
    </main>
  );
}
