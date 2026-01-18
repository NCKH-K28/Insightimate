/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import get from 'lodash/get';
import qs from 'qs';

type _NextRequest = NextRequest;
type _NextResponse = Response | NextResponse;
type _NextHandler = (
  request: _NextRequest,
  ctx: { params: Promise<any> },
) => Promise<_NextResponse> | _NextResponse;

export type HandleRequest<C = any> = _NextRequest & { params: C; query: Record<string, any> };
export type HandleResponse = _NextResponse | void;
export type Handler<C = any> = (
  req: HandleRequest<C>,
  res: HandleResponse & { json: (data: any) => HandleResponse },
) => Promise<HandleResponse> | HandleResponse;
export type Middleware<C = any> = Handler<C>;

export type NextHandler<C = any> = (
  req: _NextRequest,
  ctx: { params: Promise<C> },
) => Promise<HandleResponse | void> | HandleResponse | void;
export function compose<C = any>(...handlers: Handler<C>[]): _NextHandler {
  return async (request: _NextRequest, ctx: { params: Promise<C> }) => {
    const params = await ctx.params;
    const rawQuery = get(request, 'nextUrl.searchParams');
    const queryStr = rawQuery ? rawQuery.toString() : '';
    const query = qs.parse(queryStr, {});

    const hReq = Object.assign(request, { params, query }) as HandleRequest;
    const _res = new NextResponse();
    const hRes = Object.assign(_res, {
      json: <T>(data: T) => {
        return NextResponse.json(data, {
          status: _res.status,
          headers: _res.headers,
          statusText: _res.statusText,
          url: _res.url,
        });
      },
    });

    let chain = Promise.resolve<HandleResponse | undefined>(undefined);
    for (const handler of handlers) {
      chain = chain.then((r) => {
        if (r instanceof NextResponse) return r;
        if (r instanceof Response) return r;
        return handler(hReq, hRes);
      });
    }

    return chain.then((r) => {
      if (r instanceof NextResponse) return r;
      if (r instanceof Response) return r;
      return hRes;
    });
  };
}
