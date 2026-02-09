'use client';

import React from 'react';
import { Toaster } from '@/components/ui/sonner';
import ReactQueryProvider from '@/providers/react-query-client';
import { Provider as JotaiProvider } from 'jotai';

// import dynamic from 'next/dynamic';
// import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
// import { QueryErrorResetBoundary } from '@tanstack/react-query';
// import { AxiosError } from 'axios';
// import NotFound from '@/components/errors/not-found';
// import Forbidden from '@/components/errors/forbidden';
// import Unauthorized from '@/components/errors/unauthorized';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <JotaiProvider>{children}</JotaiProvider>
      <Toaster />
    </ReactQueryProvider>
  );
}
