import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@/lib/prisma';
import { createMiddleware } from 'hono/factory';
import { Context } from 'hono';

import serverConfig from '@/configs/server';

export const auth = betterAuth({
  baseURL: serverConfig.appURL,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
  basePath: '/api/v3/auth',
  // hooks: {
  //   before: createAuthMiddleware(async (ctx) => {
  //     const guarded = new Set(['/sign-up/email', '/change-password', '/reset-password']);
  //     if (!guarded.has(ctx.path)) return;

  //     const body = ctx.body;
  //     if (ctx.path === '/sign-up/email') {
  //       const valid = ZSignUpInput.safeParse(body);
  //       if (!valid.success)
  //         return ctx.json({ error: 'Invalid input', message: valid.error.message });
  //     }
  //     if (ctx.path === '/change-password') {
  //       const validPass = ZSignUpInput.shape.password.safeParse(body);
  //       if (!validPass.success)
  //         return ctx.json({ error: 'Invalid input', message: validPass.error.message });
  //     }
  //     if (ctx.path === '/reset-password') {
  //       const validPass = ZSignUpInput.shape.password.safeParse(body);
  //       if (!validPass.success)
  //         return ctx.json({ error: 'Invalid input', message: validPass.error.message });
  //     }
  //   }),
  // },
});

export const authenticatedGuard = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  await next();
});

export const getUser = async (c: Context) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return null;
  return session.user;
};

export const getUserAndThrow = async (c: Context) => {
  const user = await getUser(c);
  if (!user) throw new Error('Unauthorized');
  return user;
};
