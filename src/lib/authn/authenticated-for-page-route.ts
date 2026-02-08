// lib/auth/index.ts
import type { NextApiRequest } from 'next';
import cookie from 'cookie';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/authn/session';
import { UnauthorizedError, UserNotFoundError } from '@/lib/http/errors/auth-error';

export async function getAuthFromRequest(req: NextApiRequest) {
  const token = req.cookies?.access_token ?? cookie.parse(req.headers.cookie ?? '').access_token;

  if (!token) throw new UnauthorizedError();

  const payload = await verifyToken(token);
  if (!payload?.sub) throw new UnauthorizedError();

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true },
  });
  if (!user) throw new UserNotFoundError();

  return { user };
}
