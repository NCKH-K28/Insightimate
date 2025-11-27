import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

let isDebeziumPing = false;
const pingDebezium = async (request: NextRequest) => {
  const pingPath = '/api/system/debezium';
  if (isDebeziumPing) return NextResponse.next();
  isDebeziumPing = true;
  const { pathname } = request.nextUrl;
  if (pathname === pingPath) return NextResponse.next();
  await fetch(`${request.nextUrl.origin}${pingPath}`);
};

let isSocketPing: boolean = false;
const pingSocket = async (request: NextRequest) => {
  const pingPath = '/api/socket';
  if (isSocketPing) return;
  isSocketPing = true;
  const { pathname } = request.nextUrl;
  if (pathname === pingPath) return NextResponse.next();
  await fetch(`${request.nextUrl.origin}${pingPath}`);
};

const pingHealthCheck = async (request: NextRequest) => {
  const pingPath = '/api/health/ping';
  const { pathname } = request.nextUrl;
  if (pathname === pingPath) return NextResponse.next();
  await fetch(`${request.nextUrl.origin}${pingPath}`);
};

const authRoutes = ['/signin', '/signup', '/landing', '/'];
const authenticated = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith('/api/');
  if (isApiRoute) return NextResponse.next();

  // ==== Client-side cookies ====
  const cookieStore = await request.cookies;
  const { value: token } = cookieStore.get('access_token') ?? {};

  const isAuthRoute = authRoutes.includes(pathname);

  if (!token && isAuthRoute) return NextResponse.next();
  if (!token && !isAuthRoute) {
    // Redirect to landing page for all protected paths when not authenticated
    return NextResponse.redirect(new URL('/landing', request.url));
  }

  return NextResponse.next();
};

export async function middleware(request: NextRequest) {
  await Promise.all([pingSocket(request), pingHealthCheck(request), pingDebezium(request)]);

  return authenticated(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
