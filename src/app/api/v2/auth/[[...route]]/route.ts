import { ZSignInInput, ZSignUpInput } from '@/contracts/auth';
import { ZUserPublic } from '@/contracts/user';
import { authService } from '@/features/authn/server/service';
import { authenticatedHono, getAuthFromRequestHono } from '@/lib/authn';
import { httpExceptionFilterHono } from '@/lib/http/filters';
import { prisma } from '@/lib/prisma';
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

const authv2Hono = new Hono().basePath('/api/v2/auth');
authv2Hono.onError(httpExceptionFilterHono);
authv2Hono.use('me/*', authenticatedHono);

authv2Hono.post('signin', zValidator('json', ZSignInInput), async (c) => {
  const input = ZSignInInput.parse(await c.req.json());
  const { token, user } = await authService.signIn(input);
  setAuthCookie(c, token);
  return c.json(user);
});

authv2Hono.post('signup', zValidator('json', ZSignUpInput), async (c) => {
  const input = ZSignUpInput.parse(await c.req.json());
  const { token, user } = await authService.signUp(input);
  setAuthCookie(c, token);
  return c.json(user);
});

authv2Hono.post('signout', async (c) => {
  deleteCookie(c, COOKIE_NAME);
  return c.json({});
});

authv2Hono.get('me', async (c) => {
  const { userId } = await getAuthFromRequestHono(c);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  const result = ZUserPublic.parse(user);
  return c.json(result);
});

const ZMeUpdateInput = ZUserPublic.omit({ id: true, email: true });
authv2Hono.put('me', zValidator('json', ZMeUpdateInput), async (c) => {
  const { userId } = await getAuthFromRequestHono(c);
  const input = ZMeUpdateInput.parse(await c.req.json());
  const user = await prisma.user.update({ where: { id: userId }, data: input });
  const result = ZUserPublic.parse(user);
  return c.json(result);
});

authv2Hono.patch('me', zValidator('json', ZMeUpdateInput), async (c) => {
  const { userId } = await getAuthFromRequestHono(c);
  const input = ZMeUpdateInput.parse(await c.req.json());
  const user = await prisma.user.update({ where: { id: userId }, data: input });
  const result = ZUserPublic.parse(user);
  return c.json(result);
});

export const GET = handle(authv2Hono);
export const POST = handle(authv2Hono);
export const PUT = handle(authv2Hono);
export const PATCH = handle(authv2Hono);
export const DELETE = handle(authv2Hono);
export const OPTIONS = handle(authv2Hono);
