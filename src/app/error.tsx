'use client';

import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { getApiError, getErrorMsg } from '@/lib/api/helper';
import Link from 'next/link';

type ErrorProps = { error: Error & { digest?: string }; reset: () => void };
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {}, [error]);

  const apiError = useMemo(() => getApiError(error), [error]);

  const errorMessage = useMemo(() => {
    return getErrorMsg(error, 'An unexpected error occurred. Please try again later.');
  }, [error]);

  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-4'>
      <div className='flex w-full max-w-md flex-col items-center rounded-lg border p-6 shadow'>
        <h2 className='text-2xl font-bold'>Something went wrong!</h2>
        <p className='mt-2 text-center text-sm text-muted-foreground'>{errorMessage}</p>
        <div className='mt-4 flex space-x-2'>
          <Button variant='outline' onClick={reset}>
            Try again
          </Button>
          {apiError && apiError.status === 404 && (
            <Button asChild>
              <Link href='/orgs'>Back to Orgs</Link>
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
