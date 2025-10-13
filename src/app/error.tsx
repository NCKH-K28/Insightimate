'use client';

import { useEffect, useMemo } from 'react';
import get from 'lodash/get';
import { Button } from '@/components/ui/button';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error);
  }, [error]);

  const errorMessage = useMemo(() => {
    const msg = get(error, 'response.data.error', get(error, 'message', 'Unknown error'));
    return msg;
  }, [error]);

  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-4'>
      <div className='flex w-full max-w-md flex-col items-center rounded-lg border p-6 shadow'>
        <h2 className='text-2xl font-bold'>Something went wrong!</h2>
        <p className='mt-2 text-center text-sm text-muted-foreground'>{errorMessage}</p>
        <Button
          variant='outline'
          className='mt-4'
          onClick={() => {
            reset();
          }}
        >
          Try again
        </Button>
      </div>
    </main>
  );
}
