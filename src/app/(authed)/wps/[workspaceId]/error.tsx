'use client';

import { useMemo } from 'react';
import get from 'lodash/get';
import { Button } from '@/components/ui/button';
import { redirect, useParams } from 'next/navigation';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  const params = useParams<{ workspaceId: string; projectId: string }>();

  const errorMessage = useMemo(() => {
    // FIXME: improve error message
    const msg = get(
      error,
      'response.data.error',
      get(error, 'response.data.message', get(error, 'message', 'Unknown error')),
    );
    return msg;
  }, [error]);

  const errorStatus = useMemo(() => {
    return get(error, 'response.status', null);
  }, [error]);

  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-4'>
      <div className='flex w-full max-w-md flex-col items-center rounded-lg border p-6 shadow'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-red-600'>Something went wrong!</h1>
          <p className='text-gray-500'>{errorMessage}</p>
          {errorStatus && <p className='text-gray-500'> (Status: {errorStatus})</p>}
        </div>

        <div className='mt-4 flex w-full justify-center space-x-4'>
          <Button
            className='cursor-pointer'
            variant='outline'
            onClick={() => {
              reset();
            }}
          >
            Reset
          </Button>

          <Button
            className='cursor-pointer'
            onClick={() => {
              redirect(`/wps/${params.workspaceId}/projects`);
            }}
          >
            Back to Projects
          </Button>
        </div>
      </div>
    </main>
  );
}
