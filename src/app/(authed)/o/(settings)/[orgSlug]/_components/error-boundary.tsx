'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
          <AlertCircle className='h-12 w-12 text-destructive mb-4' />
          <h3 className='text-lg font-semibold mb-2'>Something went wrong!</h3>
          <p className='text-sm text-muted-foreground mb-6 max-w-sm'>{this.state.error.message}</p>
          <Button onClick={this.handleReset} variant='outline'>
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface ErrorStateProps {
  error: Error | string;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }: ErrorStateProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
      <AlertCircle className='h-12 w-12 text-destructive mb-4' />
      <h3 className='text-lg font-semibold mb-2'>{title}</h3>
      <p className='text-sm text-muted-foreground mb-6 max-w-sm'>{errorMessage}</p>
      {onRetry && (
        <Button onClick={onRetry} variant='outline'>
          Try again
        </Button>
      )}
    </div>
  );
}
