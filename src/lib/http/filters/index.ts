import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AppErrorJSON, AuthError } from '../errors';
import { ErrorHandler } from 'hono';
import { ContentfulStatusCode } from 'hono/utils/http-status';

export const handleZodError = (error: z.ZodError): NextResponse => {
  const msg = error.issues.map((issue) => `${issue.path.join('.')} - ${issue.message}`).join(', ');
  return NextResponse.json({ error: msg }, { status: 400 });
};

const AUTH_ERROR_CODE_MAP: Record<string, ContentfulStatusCode> = {
  AUTH_UNAUTHORIZED: 401,
  AUTH_FORBIDDEN: 403,
};

export const handleAuthError = (error: AuthError): NextResponse => {
  const json = error.toJSON();
  const status = AUTH_ERROR_CODE_MAP[error.code] || 500;
  return NextResponse.json({ error: json.message }, { status });
};

export const httpExceptionFilter = <T>(error: T, request: NextRequest): NextResponse => {
  if (error instanceof z.ZodError) return handleZodError(error);
  if (AuthError.isAuthError(error)) return handleAuthError(AuthError.from(error));

  console.error(`Unhandled error at ${request.url}:`, error);
  const msg =
    error instanceof Error
      ? error.message
        ? error.message
        : 'Internal server error'
      : 'Internal server error'; // FIXME: avoid exposing error details in production
  return NextResponse.json({ error: msg }, { status: 500 });
};

export const httpExceptionFilterHono: ErrorHandler = async (e, c) => {
  let json: AppErrorJSON = { code: 'UNKNOWN_ERROR', message: 'Internal server error' };
  let status: ContentfulStatusCode = 500;
  // log
  console.error(`Unhandled error at ${c.req.url}:`, e);
  if (e instanceof z.ZodError) {
    const msg = e.issues.map((issue) => `${issue.path.join('.')} - ${issue.message}`).join(', ');
    json = { code: 'VALIDATION_ERROR', message: msg };
    status = 400;
  } else if (AuthError.isAuthError(e)) {
    json = AuthError.from(e).toJSON();
    status = AUTH_ERROR_CODE_MAP[json.code] || 500;
  } else if (e instanceof Error) {
    //FIXME: avoid exposing error details in production
    const msg = e.message ? e.message : 'Internal server error';
    json = { code: 'UNKNOWN_ERROR', message: msg };
  }

  return c.json({ error: json }, status);
};
