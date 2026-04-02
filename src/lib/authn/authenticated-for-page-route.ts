// lib/auth/index.ts
import type { NextApiRequest } from 'next';
import cookie from 'cookie';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/authn/session';
import { UnauthorizedError, UserNotFoundError } from '@/lib/http/errors/auth.error';

import serverConfig from '@/configs/server';

export async function getAuthFromRequest(req: NextApiRequest) {
  const cookieName = serverConfig.auth.cookieName;
  const token = req.cookies?.[cookieName] ?? cookie.parse(req.headers.cookie ?? '')[cookieName];

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
