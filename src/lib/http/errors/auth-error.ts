import { AppError, AppErrorJSON, AppErrorOptions } from './_base';

export const AUTH_ERROR_CODE = {
  AUTH_UNKNOWN_ERROR: 'AUTH_UNKNOWN_ERROR',
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_EMAIL_ALREADY_EXISTS: 'AUTH_EMAIL_ALREADY_EXISTS',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODE)[keyof typeof AUTH_ERROR_CODE];
export type AuthErrorJSON = AppErrorJSON<AuthErrorCode>;
export class AuthError extends AppError<AuthErrorCode> {
  constructor(code: AuthErrorCode, options: AppErrorOptions | string = 'Authentication error') {
    super(code, options);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
    Error.captureStackTrace?.(this, AuthError);
  }

  static isAuthError(e: unknown): e is AuthError | AuthErrorJSON {
    if (!AppError.isAppError(e)) return false;
    if (AUTH_ERROR_CODE[e.code as AuthErrorCode]) return true;
    return false;
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message = 'Unauthorized') {
    super('AUTH_UNAUTHORIZED', message);
  }
}

export class UserNotFoundError extends AuthError {
  constructor(message = 'User not found') {
    super('AUTH_UNKNOWN_ERROR', message);
  }
}
