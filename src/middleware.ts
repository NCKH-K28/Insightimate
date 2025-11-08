import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const authRoutes = ['/signin', '/signup'];

const pingHealthCheck = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const isHealthRoute = pathname.startsWith('/api/health/');
  if (isHealthRoute) return NextResponse.next();
  await fetch(`${request.nextUrl.origin}/api/health/ping`);
};

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
    const url = new URL('/signin', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
};

export async function middleware(request: NextRequest) {
  await pingHealthCheck(request);

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
