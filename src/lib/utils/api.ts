import { NextRequest, NextResponse } from 'next/server';
import get from 'lodash/get';
import qs from 'qs';
import { httpExceptionFilter } from '../http/filters';
import { AccessTokenPayload } from '../services/auth';

// ======
export type NextContext<TParams = unknown> = { params: Promise<TParams> };
export type NextHandler<TParams = unknown> = (
  request: NextRequest,
  ctx: NextContext<TParams>,
) => Promise<NextResponse> | NextResponse;

export type ApiContext<P> = { params: P };
export type ApiRequest<Q = unknown> = NextRequest & { query: Q };
export type ApiHandler<TParams = unknown, TQuery = unknown> = (
  request: ApiRequest<TQuery>,
  ctx: ApiContext<TParams>,
) => Promise<NextResponse> | NextResponse;

export const apiHandler = <TParams = unknown>(
  handler: ApiHandler<TParams>,
): NextHandler<TParams> => {
  return async (req, ctx) => {
    try {
      const params = await ctx.params;
      const queryParams = qs.parse(req.nextUrl.searchParams.toString());
      const nextReq = Object.assign(req, { query: queryParams });
      return await handler(nextReq, { params });
    } catch (error) {
      return httpExceptionFilter(error, req);
    }
  };
};

// ======
export const createApiMutationFc = <TContext = unknown, TData = unknown>(
  ctx: TContext,
  apiFn: (ctx: TContext, data: TData) => Promise<any>,
) => {
  return (data: TData) => apiFn(ctx, data);
};

export const getUserFromRequest = async (request: NextRequest) => {
  const user = get(request, 'user');
  if (!user) throw new Error('Missing "user" in request');
  const userId = get(user, 'id');
  if (!userId) throw new Error('Missing "user.id" in request');
  return user as AccessTokenPayload & { roles?: any[] };
};

export const isAuthed = () => {
  const cookies = document.cookie;
  const tokenKey = 'access_token';
  return cookies.includes(`${tokenKey}=`);
};
