import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiHandler } from '@/lib/http/api-handler';
import { authService } from '@/features/authn/server/service';
import { ZSignInInput } from '@/contracts/auth';

export const POST = apiHandler(async (request) => {
  const body = await request.json();

  const input = ZSignInInput.parse(body);
  const { token, user } = await authService.signIn(input);
  const cookieStore = await cookies();
  cookieStore.set('access_token', token);

  return NextResponse.json(user, { status: 200 });
});
