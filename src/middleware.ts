import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';

/** =========================
 *  Proxy-style interfaces
 *  ========================= */

export type ProxyContext = { request: NextRequest; event: NextFetchEvent };
export type ProxyResult = NextResponse;

export interface ProxyChainHandler {
  name: string;
  handle(ctx: ProxyContext): Promise<ProxyResult> | ProxyResult;
}

export interface ProxySideEffectHandler {
  name: string;
  run(ctx: ProxyContext): Promise<void> | void;
}

export interface ProxyPipeline {
  sideEffects?: ProxySideEffectHandler[];
  chain: ProxyChainHandler[];
}

/** Helper: check NextResponse.next() */
function isNextResponse(res: NextResponse) {
  // NextResponse.next() set header `x-middleware-next: 1`
  return res.headers.get('x-middleware-next') === '1';
}

/** Main proxy executor */
export async function proxy(p: ProxyPipeline, ctx: ProxyContext): Promise<NextResponse> {
  // Run side-effects in background (không block response)
  for (const fx of p.sideEffects ?? []) {
    ctx.event.waitUntil(Promise.resolve(fx.run(ctx)));
  }

  // Run chain sequentially; stop when a handler returns non-next()
  for (const h of p.chain) {
    const res = await h.handle(ctx);
    if (!isNextResponse(res)) return res;
  }

  return NextResponse.next();
}

/** =========================
 *  Your handlers
 *  ========================= */

// ---- Side-effects: ping once per runtime instance ----
let didPingDebezium = false;
const PingDebezium: ProxySideEffectHandler = {
  name: 'PingDebezium',
  async run({ request }) {
    const pingPath = '/api/system/debezium';
    if (didPingDebezium) return;
    if (request.nextUrl.pathname === pingPath) return;

    didPingDebezium = true;
    try {
      await fetch(`${request.nextUrl.origin}${pingPath}`);
    } catch {
      // ignore
    }
  },
};

let didPingSocket = false;
const PingSocket: ProxySideEffectHandler = {
  name: 'PingSocket',
  async run({ request }) {
    const pingPath = '/api/socket';
    if (didPingSocket) return;
    if (request.nextUrl.pathname === pingPath) return;

    didPingSocket = true;
    try {
      await fetch(`${request.nextUrl.origin}${pingPath}`);
    } catch {
      // ignore
    }
  },
};

// ---- Chain: auth/redirect rules ----
const AUTH_ROUTES = new Set(['/signin', '/signup']);
const PROTECTED_PREFIXES = ['/orgs', '/o'];

function isApiRoute(pathname: string) {
  return pathname.startsWith('/api/');
}

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function tokenOf(request: NextRequest) {
  return request.cookies.get('access_token')?.value;
}

const AuthGuard: ProxyChainHandler = {
  name: 'AuthGuard',
  handle({ request }) {
    const { pathname } = request.nextUrl;

    // Không áp auth cho API
    if (isApiRoute(pathname)) return NextResponse.next();

    const token = tokenOf(request);
    const isAuthPage = AUTH_ROUTES.has(pathname);
    const needsAuth = isProtected(pathname);

    if (!token && needsAuth) {
      const url = request.nextUrl.clone();
      url.pathname = '/signin';
      url.searchParams.set('from', request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }

    if (token && isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/orgs';
      url.search = '';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
};

/** =========================
 *  Next middleware entry
 *  ========================= */

export function middleware(request: NextRequest, event: NextFetchEvent) {
  return proxy(
    {
      // sideEffects: [PingSocket, PingDebezium],
      chain: [AuthGuard],
    },
    { request, event },
  );
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs',
};
