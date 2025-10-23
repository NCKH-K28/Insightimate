import { NextRequest, NextResponse } from 'next/server';
import get from 'lodash/get';
import qs from 'qs';

type _NextRequest = Request | NextRequest;
type _NextResponse = Response | NextResponse;
type _NextHandler = (
  request: _NextRequest,
  ctx: { params: Promise<any> },
) => Promise<_NextResponse> | _NextResponse;

export type HandleRequest<C = any> = _NextRequest & { params: C; query: Record<string, any> };
type HandleResponse = _NextResponse;
export type Handler<C = any> = (
  req: HandleRequest<C>,
  res: HandleResponse,
) => Promise<HandleResponse> | HandleResponse;

export type NextHandler<C = any> = (
  req: _NextRequest,
  ctx: { params: Promise<C> },
) => Promise<HandleResponse | void> | HandleResponse | void;
export function compose<C = any>(...handlers: Handler<C>[]): _NextHandler {
  return async (request: _NextRequest, ctx: { params: Promise<C> }) => {
    const params = await ctx.params;
    const rawQuery = get(request, 'nextUrl.searchParams');
    const queryStr = rawQuery ? rawQuery.toString() : '';
    const query = qs.parse(queryStr);

    const hReq = Object.assign(request, { params, query }) as HandleRequest;
    const res: HandleResponse = new Response(null, { status: 404 });
    let chain = Promise.resolve<HandleResponse>(res);
    for (const handler of handlers) {
      chain = chain.then((r) => {
        if (r instanceof NextResponse) return r;
        if (r instanceof Response) return r;
        return handler(hReq, r);
      });
    }

    return chain;
  };
}
