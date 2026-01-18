'use client';

import { useEffect, useMemo } from 'react';
import get from 'lodash/get';
import { Button } from '@/components/ui/button';
import { AppError } from '@/lib/http/errors';

const getErrorMessage = (error: Error & { digest?: string }): string | undefined => {
  const resErr = get(error, 'response.data.error');
  if (resErr && AppError.isAppError(resErr)) {
    const appErr = AppError.from(resErr);
    return appErr.message;
  } else if (error.message) {
    return error.message;
  }
};

type ErrorProps = { error: Error & { digest?: string }; reset: () => void };
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {}, [error]);

  const errorMessage = useMemo(() => {
    const msg = getErrorMessage(error);
    return msg || 'An unexpected error occurred. Please try again later.';
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
