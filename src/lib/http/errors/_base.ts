type Meta = Record<string, unknown>;
export type AppErrorCode = string;
export type AppErrorJSON<TCode extends AppErrorCode = AppErrorCode> = {
  code: TCode;
  message: string;
  issues?: unknown;
  meta?: Meta;
};

export type AppErrorOptions = {
  message?: string;
  issues?: unknown;
  meta?: Meta;
};

export class AppError<TCode extends AppErrorCode = AppErrorCode> extends Error {
  readonly code: TCode;
  readonly issues?: unknown;
  readonly meta?: Meta;

  constructor(code: TCode, options: AppErrorOptions | string = 'Application error') {
    const msg = typeof options === 'string' ? options : options.message;
    super(msg);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace?.(this, AppError);

    this.code = code;
    if (typeof options === 'object' && options) {
      this.issues = options.issues;
      this.meta = options.meta;
    }
  }

  toJSON(options?: AppErrorOptions): AppErrorJSON<TCode> {
    return {
      message: this.message,
      issues: this.issues,
      meta: this.meta,
      ...options,
      code: this.code,
    };
  }

  static from<TCode extends AppErrorCode = AppErrorCode>(
    error: AppError<TCode> | AppErrorJSON<TCode>,
  ): AppError<TCode> {
    if (error instanceof AppError) return error;
    return AppError.fromJSON(error);
  }

  static fromJSON<TCode extends AppErrorCode = AppErrorCode>(
    json: AppErrorJSON<TCode>,
  ): AppError<TCode> {
    return new AppError(json.code, { message: json.message, issues: json.issues, meta: json.meta });
  }

  static isAppError(err: unknown): err is AppError | AppErrorJSON {
    if (err instanceof AppError) return true;
    if (typeof err !== 'object' || err === null || err === undefined) return false;
    if (!('code' in err) || !('message' in err)) return false;
    if (typeof err.code !== 'string' || typeof err.message !== 'string') return false;
    return true;
  }
}

export const normalizeAppError = (err: unknown): AppError => {
  if (err instanceof AppError) return err;
  if (AppError.isAppError(err)) return AppError.fromJSON(err);
  if (err instanceof Error) return new AppError('UNKNOWN_ERROR', { message: err.message });
  if (typeof err === 'string') return new AppError('UNKNOWN_ERROR', { message: err });
  return new AppError('UNKNOWN_ERROR', { message: 'Unknown error' });
};
