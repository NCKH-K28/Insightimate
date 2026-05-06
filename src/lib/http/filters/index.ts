import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AppErrorJSON, AuthError, OrgError, OrgErrorCode } from '../errors';
import { ProjectError, ProjectErrorCode } from '../errors/proj.error';
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

const ORG_ERROR_CODE_MAP: Record<OrgErrorCode, ContentfulStatusCode> = {
  ORG_NOT_FOUND: 404,
  ORG_CONFLICT: 409,
  ORG_FORBIDDEN: 403,
  ORG_INVALID_DATA: 400,
  ORG_UNKNOWN: 500,
  ORG_INVITE_NOT_FOUND: 404,
  ORG_INVALID_INVITE_TOKEN: 400,
  ORG_INVITE_ALREADY_ACCEPTED: 409,
  ORG_INVITE_EXPIRED: 410,
  ORG_INVITER_NOT_FOUND: 404,
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

const PROJECT_ERROR_CODE_MAP: Record<ProjectErrorCode, ContentfulStatusCode> = {
  PROJECT_NOT_FOUND: 404,
  PROJECT_ALREADY_EXISTS: 409,
  PROJECT_PERMISSION_DENIED: 403,
  PROJECT_INVALID_INPUT: 400,
  CANNOT_DELETE_LAST_TYPE: 400,
};

export const httpExceptionFilterHono: ErrorHandler = async (e, c) => {
  console.error(e);

  let json: AppErrorJSON = { code: 'UNKNOWN_ERROR', message: 'Internal server error' };
  let status: ContentfulStatusCode = 500;
  if (e instanceof z.ZodError) {
    const msg = e.issues.map((issue) => `${issue.path.join('.')} - ${issue.message}`).join(', ');
    json = { code: 'VALIDATION_ERROR', message: msg };
    status = 400;
  } else if (AuthError.isAuthError(e)) {
    json = AuthError.from(e).toJSON();
    status = AUTH_ERROR_CODE_MAP[json.code] || 500;
  } else if (e instanceof OrgError) {
    json = e.toJSON();
    status = ORG_ERROR_CODE_MAP[e.code] || 500;
  } else if (e instanceof ProjectError) {
    json = e.toJSON();
    status = PROJECT_ERROR_CODE_MAP[e.code as ProjectErrorCode] ?? 500;
  } else if (e instanceof Error) {
    // Detect JWT/auth errors from Hono JWT middleware
    const msg = e.message || '';
    const isJwtError = [
      'no authorization included in request',
      'invalid token',
      'token expired',
      'jwt malformed',
    ].some((errMsg) => msg.toLowerCase().includes(errMsg.toLowerCase()));
    if (isJwtError) {
      json = { code: 'AUTH_UNAUTHORIZED', message: msg };
      status = 401;
    } else {
      //FIXME: avoid exposing error details in production
      json = { code: 'UNKNOWN_ERROR', message: msg || 'Internal server error' };
    }
  }

  return c.json({ error: json }, status);
};
