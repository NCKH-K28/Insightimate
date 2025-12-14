import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/auth';
import { authenticated, authenticatedV2 } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { compose } from '@/lib/http/api-compose';
import { getZodBody, zodBodyPipe } from '@/lib/http/zod-pipes';
import { ZUserPublic } from '@/contracts/users';

export const GET = middlewareHandler([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const userId = auth.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) throw new Error('User not found');
  return NextResponse.json(user, { status: 200 });
});

const ZMeUpdateInput = ZUserPublic.omit({ id: true, email: true });
export const PUT = compose(authenticatedV2, zodBodyPipe(ZMeUpdateInput), async (req) => {
  const auth = await getAuthFromRequest(req);
  const userId = auth.user.id;

  const input = getZodBody(req, ZMeUpdateInput);
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { name: input.name, avatar: input.avatar },
  });

  const result = ZUserPublic.parse(updatedUser);

  return NextResponse.json(result, { status: 200 });
});

export const PATCH = compose(authenticatedV2, zodBodyPipe(ZMeUpdateInput), async (req) => {
  const auth = await getAuthFromRequest(req);
  const userId = auth.user.id;

  const input = getZodBody(req, ZMeUpdateInput);
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { name: input.name, avatar: input.avatar },
  });

  const result = ZUserPublic.parse(updatedUser);

  return NextResponse.json(result, { status: 200 });
});
