 

import { Middleware } from '@/lib/http/api-compose';
import { NextResponse } from 'next/server';
import z from 'zod';

/**
 * Dùng Symbol để tránh va chạm key trên req
 */
const ZOD_BODY_SCHEMA_KEY = Symbol('zod.body.schema');
const ZOD_PARAM_SCHEMA_KEY = Symbol('zod.params.schema');
const ZOD_QUERY_SCHEMA_KEY = Symbol('zod.query.schema');

const ZOD_PARSED_BODY_KEY = Symbol('zod.body.parsed');
const ZOD_PARSED_PARAMS_KEY = Symbol('zod.params.parsed');
const ZOD_PARSED_QUERY_KEY = Symbol('zod.query.parsed');

/**
 * build message lỗi chung
 */
const buildErrorMessage = (issues: z.ZodIssue[]) =>
  issues.map((i) => `${i.path.join('.') || '<root>'} : ${i.message}`).join('; ');

/**
 * Trả về response 400 chuẩn
 */
const invalidResponse = (message: string) =>
  NextResponse.json({ error: 'Invalid request', message }, { status: 400 });

/**
 * Lấy query từ nhiều kiểu request (NextRequest, custom req,...)
 */
const getQueryObject = (req: any): Record<string, unknown> => {
  if (req?.query && typeof req.query === 'object') {
    return req.query as Record<string, unknown>;
  }
  if (req?.nextUrl?.searchParams) {
    return Object.fromEntries(req.nextUrl.searchParams.entries());
  }
  return {};
};

/**
 * Đọc body an toàn: nếu không có body hoặc đã đọc thì trả về {}
 */
const getJsonBodySafe = async (req: any): Promise<unknown> => {
  // nếu request có clone/arrayBuffer/... bạn có thể mở rộng thêm
  try {
    return await req.json();
  } catch {
    return {};
  }
};

/**
 * ------------------------
 *      MIDDLEWARES
 * ------------------------
 */

export const zodQueryPipe = <T>(schema: z.ZodType<T>): Middleware => {
  return async (req) => {
    // lưu schema
    (req as any)[ZOD_QUERY_SCHEMA_KEY] = schema;

    const query = getQueryObject(req);
    const parsed = schema.safeParse(query);

    if (!parsed.success) {
      return invalidResponse(buildErrorMessage(parsed.error.issues));
    }

    (req as any)[ZOD_PARSED_QUERY_KEY] = parsed.data;
  };
};

export const zodParamsPipe = <T>(schema: z.ZodType<T>): Middleware => {
  return async (req) => {
    (req as any)[ZOD_PARAM_SCHEMA_KEY] = schema;

    const params = (req as any).params || {};
    const parsed = schema.safeParse(params);

    if (!parsed.success) {
      return invalidResponse(buildErrorMessage(parsed.error.issues));
    }

    (req as any)[ZOD_PARSED_PARAMS_KEY] = parsed.data;
  };
};

export const zodBodyPipe = <T>(schema: z.ZodType<T>): Middleware => {
  return async (req) => {
    (req as any)[ZOD_BODY_SCHEMA_KEY] = schema;

    const body = await getJsonBodySafe(req);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return invalidResponse(buildErrorMessage(parsed.error.issues));
    }

    (req as any)[ZOD_PARSED_BODY_KEY] = parsed.data;
  };
};

/**
 * ------------------------
 *      GETTERS
 * ------------------------
 */

export const getZodBody = <T>(req: Request, schema: z.ZodType<T>): T => {
  const saved = (req as any)[ZOD_BODY_SCHEMA_KEY];
  if (!saved) {
    throw new Error('Zod schema for body not found on request. Did you use zodBodyPipe?');
  }
  if (saved !== schema) {
    throw new Error('Zod body schema mismatch on request.');
  }
  return (req as any)[ZOD_PARSED_BODY_KEY] as T;
};

export const getZodParams = <T>(req: Request, schema: z.ZodType<T>): T => {
  const saved = (req as any)[ZOD_PARAM_SCHEMA_KEY];
  if (!saved) {
    throw new Error('Zod schema for params not found on request. Did you use zodParamsPipe?');
  }
  if (saved !== schema) {
    throw new Error('Zod params schema mismatch on request.');
  }
  return (req as any)[ZOD_PARSED_PARAMS_KEY] as T;
};

export const getZodQuery = <T>(req: Request, schema: z.ZodType<T>): T => {
  const saved = (req as any)[ZOD_QUERY_SCHEMA_KEY];
  if (!saved) {
    throw new Error('Zod schema for query not found on request. Did you use zodQueryPipe?');
  }
  if (saved !== schema) {
    throw new Error('Zod query schema mismatch on request.');
  }
  return (req as any)[ZOD_PARSED_QUERY_KEY] as T;
};
