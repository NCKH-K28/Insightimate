import { ZUser } from '@/contracts/users';
import { middlewareHandler } from '@/lib/http/api-handler';
import { authenticated } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { get } from 'lodash';
import { NextResponse } from 'next/server';

export const GET = middlewareHandler([authenticated], async (request) => {
  const auth = get(request, 'auth', null);
  if (!auth) throw new Error('Missing "auth" in "request"');
  const userId = get(auth, 'user.id', null);
  if (!userId) throw new Error('Missing "auth.user.id" in "request.auth"');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, avatar: true, createdAt: true, updatedAt: true },
  });
  if (!user) throw new Error('User not found');

  const data = ZUser.parse(user);
  return NextResponse.json(data, { status: 200 });
});
