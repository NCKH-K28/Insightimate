'use client';

import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import type { AxiosError } from 'axios';
import get from 'lodash/get';

// Helpers
function getStatus(error: unknown): number | undefined {
  const e = error as AxiosError | any;
  return e?.response?.status;
}

function isNetworkError(error: unknown): boolean {
  const e = error as any;
  return !e?.response;
}

function shouldRetry(error: unknown): boolean {
  const status = getStatus(error);

  if (isNetworkError(error)) return true;

  if (status === 408) return true; // Request Timeout
  if (status === 429) return true; // Too Many Requests
  if (status && status >= 500) return true; // Server errors

  if (status && status >= 400 && status < 500) return false;

  return true;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: true,
      retry: (failureCount, error) => {
        if (failureCount >= 3) return false;
        return shouldRetry(error);
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),

      // Tuỳ chọn: giảm retry khi user rời tab
      // refetchOnWindowFocus: false,
    },

    mutations: {
      retry: (failureCount, error) => {
        if (failureCount >= 2) return false;

        const status = getStatus(error);
        if (isNetworkError(error)) return true;
        if (status === 429 || (status && status >= 500)) return true;
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
    },
  },
  mutationCache: new MutationCache({
    onSettled(_data, _error, _variables, _context, mutation) {
      const isClear = get(mutation.meta, 'clear', false);
      if (isClear === true) queryClient.clear();

      const invalidateQueries = get(mutation.meta, 'invalidateQueries', []);
      if (Array.isArray(invalidateQueries)) {
        invalidateQueries.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      } else console.warn("'invalidateQueries' meta should be an array of query keys.");
    },
  }),
});

export default function ReactQueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
