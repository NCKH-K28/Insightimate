import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { GuardHandler } from '@/lib/http/api-handler';
import { AuthContext } from '@/contracts/auth';
import { verifyToken } from '@/lib/authn/session';
import { HandleRequest, Middleware } from '../http/api-compose';
import serverConfig from '@/configs/server';
import { jwt } from 'hono/jwt';
import { AuthError } from '@/lib/http/errors';

const ACCESS_TOKEN_KEY = serverConfig.auth.cookieName;
export const authenticated: GuardHandler = async (request) => {
  const cookieStore = await cookies();
  try {
    const { value: token } = cookieStore.get(ACCESS_TOKEN_KEY) ?? {};
    if (!token) throw new AuthError('AUTH_UNAUTHORIZED');

    const payload = await verifyToken(token);
    if (!payload) throw new AuthError('AUTH_INVALID_TOKEN');

    // FIXME: khong nen goi db o day
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true },
    });
    if (!user) throw new AuthError('AUTH_UNKNOWN_ERROR');

    const auth: AuthContext = { user };

    Object.assign(request, { auth });
  } catch (error) {
    cookieStore.delete(ACCESS_TOKEN_KEY);
    throw error;
  }
};

export const authenticatedV2: Middleware = (req: HandleRequest) =>
  authenticated(req, { params: req.params });

const authConfig = serverConfig.auth;
export const authenticatedHono = jwt({
  secret: authConfig.secret,
  cookie: authConfig.cookieName,
  alg: 'HS256',
});
