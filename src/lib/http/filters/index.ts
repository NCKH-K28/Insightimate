import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { AuthError, ForbiddenError } from '@/lib/http/errors/auth.error';

export const handleZodError = (error: z.ZodError): NextResponse => {
  const msg = error.issues.map((issue) => `${issue.path.join('.')} - ${issue.message}`).join(', ');
  return NextResponse.json({ error: msg }, { status: 400 });
};

export const handleAuthError = (error: AuthError): NextResponse => {
  if (error instanceof ForbiddenError) {
    const msg = error.message || 'Forbidden';
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const msg = error.message || 'Authentication error';
  return NextResponse.json({ error: msg }, { status: 401 });
};

export const httpExceptionFilter = <T>(error: T, request: NextRequest): NextResponse => {
  if (error instanceof z.ZodError) return handleZodError(error);
  if (error instanceof AuthError) return handleAuthError(error);

  console.error(`Unhandled error at ${request.url}:`, error);
  const msg =
    error instanceof Error
      ? error.message
        ? error.message
        : 'Internal server error'
      : 'Internal server error'; // FIXME: avoid exposing error details in production
  return NextResponse.json({ error: msg }, { status: 500 });
};
