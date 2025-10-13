'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ReactNode, useState } from 'react';

export default function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            throwOnError: true,
            retry(failureCount, error) {
              return false;

              // FIXME: improve retry logic
              if (failureCount >= 3) return false;
              if (error instanceof AxiosError) {
                const status = error.response?.status;
                if (!status) return true; // Network error, retry
                if (status === 429) return true; // Retry on 429 (Too Many Requests)
                if (status >= 400 && status < 500) return false; // Do not retry on other 4xx errors
              }

              return true;
            },
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
