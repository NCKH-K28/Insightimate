'use client';

import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import get from 'lodash/get';

const queryClient = new QueryClient({
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
  defaultOptions: {
    queries: {
      throwOnError: true,
      retry() {
        return false;
        // return false;
        // // FIXME: improve retry logic
        // if (failureCount >= 3) return false;
        // if (error instanceof AxiosError) {
        //   const status = error.response?.status;
        //   if (!status) return true; // Network error, retry
        //   if (status === 429) return true; // Retry on 429 (Too Many Requests)
        //   if (status >= 400 && status < 500) return false; // Do not retry on other 4xx errors
        // }
        // return true;
      },
    },
  },
});

export default function ReactQueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
