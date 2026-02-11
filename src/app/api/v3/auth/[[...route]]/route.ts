import { ZSignInInput, ZSignUpInput } from '@/contracts/auth';
import { authService } from '@/features/authn/server/service';
import { httpExceptionFilterHono } from '@/lib/http/filters';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { setCookie, deleteCookie } from 'hono/cookie';
import serverConfig from '@/configs/server';

const COOKIE_NAME = serverConfig.auth.cookieName;
const setAuthCookie = (c: any, token: string) => {
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
};

const authv3Hono = new Hono().basePath('/api/v3/auth');
authv3Hono.onError(httpExceptionFilterHono);

authv3Hono.post('signin', zValidator('json', ZSignInInput), async (c) => {
  const input = ZSignInInput.parse(await c.req.json());
  const { token, user } = await authService.signIn(input);
  setAuthCookie(c, token);
  return c.json(user);
});

authv3Hono.post('signup', zValidator('json', ZSignUpInput), async (c) => {
  const input = ZSignUpInput.parse(await c.req.json());
  const { token, user } = await authService.signUp(input);
  setAuthCookie(c, token);
  return c.json(user);
});

authv3Hono.post('signout', async (c) => {
  deleteCookie(c, COOKIE_NAME);
  return c.json({});
});

export const GET = handle(authv3Hono);
export const POST = handle(authv3Hono);
export const PUT = handle(authv3Hono);
export const PATCH = handle(authv3Hono);
export const DELETE = handle(authv3Hono);
export const OPTIONS = handle(authv3Hono);
