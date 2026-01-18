import { AppError, AppErrorOptions } from './_base';

export const ORG_ERROR_CODE = {
  ORG_NOT_FOUND: 'ORG_NOT_FOUND',
  ORG_FORBIDDEN: 'ORG_FORBIDDEN',
  ORG_INVALID_DATA: 'ORG_INVALID_DATA',
  ORG_CONFLICT: 'ORG_CONFLICT',
  ORG_UNKNOWN: 'ORG_UNKNOWN',
} as const;
export type OrgErrorCode = (typeof ORG_ERROR_CODE)[keyof typeof ORG_ERROR_CODE];

export class OrgError extends AppError<OrgErrorCode> {
  constructor(code: OrgErrorCode, options: AppErrorOptions = { message: 'Organization error' }) {
    super(code, options);
    this.name = 'OrgError';
    Object.setPrototypeOf(this, OrgError.prototype);
    Error.captureStackTrace?.(this, OrgError);
  }
}
