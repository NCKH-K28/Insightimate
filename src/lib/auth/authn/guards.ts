import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { UnauthorizedError, UserNotFoundError } from '@/lib/http/errors';
import { GuardHandler } from '@/lib/http/api-handler';
import { AuthContext } from '@/contracts/auth';
import { verifyToken } from '@/lib/auth/authn/session';
import { HandleRequest, Middleware } from '../../http/api-compose';

export const authenticated: GuardHandler = async (request) => {
  const cookieStore = await cookies();
  try {
    const token = cookieStore.get('access_token')?.value;
    if (!token) throw new UnauthorizedError();

    const payload = await verifyToken(token);
    if (!payload) throw new UnauthorizedError();

    // FIXME: khong nen goi db o day
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true },
    });
    if (!user) throw new UserNotFoundError();

    const auth: AuthContext = { user };

    Object.assign(request, { auth });
  } catch (error) {
    cookieStore.delete('access_token');
    throw error;
  }
};

export const authenticatedV2: Middleware = (req: HandleRequest) =>
  authenticated(req, { params: req.params });
