// src/lib/errors/org-error.ts

export const ORG_ERROR_CODE = {
  ORG_NOT_FOUND: 'ORG_NOT_FOUND',
  ORG_FORBIDDEN: 'ORG_FORBIDDEN',
  ORG_INVALID_DATA: 'ORG_INVALID_DATA',
  ORG_CONFLICT: 'ORG_CONFLICT',
  ORG_UNKNOWN: 'ORG_UNKNOWN',
} as const;

export type OrgErrorCode = (typeof ORG_ERROR_CODE)[keyof typeof ORG_ERROR_CODE];
export type OrgErrorJSON = Readonly<{
  code: OrgErrorCode;
  message: string;
  issues?: unknown;
  meta?: Record<string, unknown>;
}>;

export class OrgError extends Error {
  readonly code: OrgErrorCode;
  readonly issues?: unknown;
  readonly meta?: Record<string, unknown>;

  private static readonly CODE_SET = new Set<string>(Object.values(ORG_ERROR_CODE));

  constructor(
    code: OrgErrorCode,
    options: { message?: string; issues?: unknown; meta?: Record<string, unknown> } = {},
  ) {
    super(options.message ?? 'Organization error occurred');
    this.name = 'OrgError';
    Error.captureStackTrace?.(this, OrgError);
    Object.setPrototypeOf(this, OrgError.prototype);

    this.code = code;
    this.issues = options.issues;
    this.meta = options.meta;
  }

  toJSON(): OrgErrorJSON {
    return { code: this.code, message: this.message, issues: this.issues, meta: this.meta };
  }

  static fromJSON(json: OrgErrorJSON): OrgError {
    return new OrgError(json.code, { message: json.message, issues: json.issues, meta: json.meta });
  }

  static isOrgError(err: unknown): err is OrgError | OrgErrorJSON {
    if (err instanceof OrgError) return true;
    if (typeof err !== 'object' || err === null || err === undefined) return false;
    if (!('code' in err) || !('message' in err)) return false;
    if (typeof err.code !== 'string' || typeof err.message !== 'string') return false;
    if (!OrgError.CODE_SET.has(err.code)) return false;
    return true;
  }
}

export const normalizeOrgError = (err: unknown): OrgError => {
  if (err instanceof OrgError) return err;
  if (OrgError.isOrgError(err)) return OrgError.fromJSON(err);
  return new OrgError(ORG_ERROR_CODE.ORG_UNKNOWN, { message: String(err) });
};
