 

import qs from 'qs';
import { NextRequest, NextResponse } from 'next/server';
import { httpExceptionFilter } from './filters';

// ======
export type NextContext<TParams = unknown> = { params: Promise<TParams> };
export type NextHandler<TParams = unknown> = (
  request: NextRequest,
  ctx: NextContext<TParams>,
) => Promise<NextResponse> | NextResponse;

export type ApiContext<P> = { params: P };
export type ApiRequest<Q = unknown, B = unknown, P = unknown> = NextRequest & {
  query: Q;
  params: P;
  _body?: B;
};
export type ApiHandler<TParams = unknown, TQuery = unknown, TBody = unknown> = (
  request: ApiRequest<TQuery, TBody, TParams>,
  ctx: ApiContext<TParams>,
) => Promise<NextResponse> | NextResponse;

export const apiHandler = <TParams = unknown, TQuery = unknown, TBody = unknown>(
  handler: ApiHandler<TParams, TQuery, TBody>,
): NextHandler<TParams> => {
  return async (req, ctx) => {
    try {
      // const getBody = async () => (req.method === 'GET' ? {} : await req.json());
      const [params] = await Promise.all([ctx.params]);
      const query = qs.parse(req.nextUrl.searchParams.toString());
      const nextReq = Object.assign(req, { query, params }) as ApiRequest<TQuery, TBody, TParams>;

      return await handler(nextReq, { params });
    } catch (error) {
      return httpExceptionFilter(error, req);
    }
  };
};

export type MiddlewareParams<TParams = unknown> = Parameters<ApiHandler<TParams>>;
export type MiddlewareHandler = (
  ...args: MiddlewareParams
) => Promise<NextResponse | void> | NextResponse | void | any;
export const middlewareHandler = <TParams = unknown>(
  middlewares: Array<MiddlewareHandler>,
  handler: ApiHandler<TParams>,
) => {
  return apiHandler<TParams>((req, ctx) => {
    let chain = Promise.resolve<NextResponse | void>(undefined);
    for (const mw of middlewares) {
      chain = chain.then((res) => {
        if (res instanceof NextResponse) return res;
        return mw(req, ctx);
      });
    }

    return chain.then((res) => {
      if (res instanceof NextResponse) return res;
      return handler(req, ctx);
    });
  });
};

// ===== Guard
export type GuardParams = MiddlewareParams;
export type GuardHandler = MiddlewareHandler;
