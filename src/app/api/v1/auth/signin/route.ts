import { NextResponse } from 'next/server';
import { signInSchema } from '../../../../../../.temp/schemas/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { generateToken } from '@/lib/auth/session';
import { apiHandler } from '@/lib/http/api-handler';

export const POST = apiHandler(async (request) => {
  const body = await request.json();
  const input = signInSchema.parse(body);

  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  const valid = await verifyPassword(input.password, user.credential);
  if (!valid) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

  const token = await generateToken({ sub: user.id, email: user.email });
  const cookieStore = await cookies();
  cookieStore.set('access_token', token);

  return NextResponse.json({ message: 'Sign in successful' }, { status: 200 });
});
