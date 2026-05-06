import { AppError, AppErrorOptions } from './_base';

export const PROJECT_ERROR_CODES = {
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  PROJECT_ALREADY_EXISTS: 'PROJECT_ALREADY_EXISTS',
  PROJECT_PERMISSION_DENIED: 'PROJECT_PERMISSION_DENIED',
  PROJECT_INVALID_INPUT: 'PROJECT_INVALID_INPUT',
  CANNOT_DELETE_LAST_TYPE: 'CANNOT_DELETE_LAST_TYPE',
} as const;

export type ProjectErrorCode = (typeof PROJECT_ERROR_CODES)[keyof typeof PROJECT_ERROR_CODES];

export class ProjectError extends AppError {
  constructor(
    code: ProjectErrorCode,
    options: AppErrorOptions | string = { message: 'Project error' },
  ) {
    super(code, options);
    this.name = 'ProjectError';
    Object.setPrototypeOf(this, ProjectError.prototype);
    Error.captureStackTrace?.(this, ProjectError);
  }
}
