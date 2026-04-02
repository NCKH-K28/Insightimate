import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import serverConfig from './configs/server';

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
const PUBLIC_ROUTES = new Set(['/', '/forgot-password', '/reset-password', ...AUTH_ROUTES]);

function isApiRoute(pathname: string) {
  return pathname.startsWith('/api/');
}

function isProtected(pathname: string) {
  // Bỏ qua các API route, webhook
  if (isApiRoute(pathname)) return false;
  // Bỏ qua các Public routes
  if (PUBLIC_ROUTES.has(pathname)) return false;
  
  return true; // Tất cả các route còn lại đều là protected
}

const AuthGuard: ProxyChainHandler = {
  name: 'AuthGuard',
  handle({ request }) {
    const { pathname, searchParams } = request.nextUrl;

    const session = getSessionCookie(request);
    const isAuthPage = AUTH_ROUTES.has(pathname);
    const needsAuth = isProtected(pathname);

    // Xử lý các API Routes bên trong AuthGuard
    if (isApiRoute(pathname)) return NextResponse.next();

    if (!session && needsAuth) {
      const url = request.nextUrl.clone();
      url.pathname = '/signin';
      url.searchParams.set('from', pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }

    if (session && isAuthPage) {
      const url = request.nextUrl.clone();
      const redirectTarget = searchParams.get('from');
      
      if (redirectTarget && redirectTarget.startsWith('/')) {
        url.pathname = redirectTarget.split('?')[0]; // simple handling
        url.search = redirectTarget.includes('?') ? redirectTarget.split('?')[1] : '';
      } else {
        url.pathname = '/orgs';
        url.search = '';
      }
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
