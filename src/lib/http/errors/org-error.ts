import { AppError, AppErrorOptions } from './_base';

export const ORG_ERROR_CODE = {
  ORG_NOT_FOUND: 'ORG_NOT_FOUND',
  ORG_FORBIDDEN: 'ORG_FORBIDDEN',
  ORG_INVALID_DATA: 'ORG_INVALID_DATA',
  ORG_CONFLICT: 'ORG_CONFLICT',
  ORG_UNKNOWN: 'ORG_UNKNOWN',

  ORG_INVITE_NOT_FOUND: 'ORG_INVITE_NOT_FOUND',
  ORG_INVALID_INVITE_TOKEN: 'ORG_INVALID_INVITE_TOKEN',
  ORG_INVITE_ALREADY_ACCEPTED: 'ORG_INVITE_ALREADY_ACCEPTED',
  ORG_INVITE_EXPIRED: 'ORG_INVITE_EXPIRED',
  ORG_INVITER_NOT_FOUND: 'ORG_INVITER_NOT_FOUND',
} as const;
export type OrgErrorCode = (typeof ORG_ERROR_CODE)[keyof typeof ORG_ERROR_CODE];

export class OrgError extends AppError<OrgErrorCode> {
  constructor(
    code: OrgErrorCode,
    options: AppErrorOptions | string = { message: 'Organization error' },
  ) {
    super(code, options);
    this.name = 'OrgError';
    Object.setPrototypeOf(this, OrgError.prototype);
    Error.captureStackTrace?.(this, OrgError);
  }
}
