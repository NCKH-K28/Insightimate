'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Toaster } from '@/components/ui/sonner';
import ReactQueryProvider from '@/providers/react-query-client';
import { Provider as JotaiProvider } from 'jotai';

import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import NotFound from '@/components/errors/not-found';
import Forbidden from '@/components/errors/forbidden';
import Unauthorized from '@/components/errors/unauthorized';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <JotaiProvider>{children}</JotaiProvider>
      <Toaster />
    </ReactQueryProvider>
  );
}

const fallbackRender: React.ComponentType<FallbackProps> = (props) => {
  const { error } = props;
  if (error instanceof AxiosError) {
    if (error.response?.status === 404) return <NotFound {...props} />;
    if (error.response?.status === 403) return <Forbidden {...props} />;
    if (error.response?.status === 401) return <Unauthorized {...props} />;
  }

  throw error;
};

const LayoutWithBoundary = (props: { children: React.ReactNode }) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary FallbackComponent={fallbackRender} onReset={reset}>
          <AppLayout {...props} />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};

export default dynamic(() => Promise.resolve(LayoutWithBoundary), { ssr: false });
