import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiHandler } from '@/lib/http/api-handler';
import { ZSignUpInput } from '@/contracts/auth';
import { authService } from '@/features/authn/server/service';

export const POST = apiHandler(async (request) => {
  const body = await request.json();
  const valid = ZSignUpInput.parse(body);
  const { token, user } = await authService.signUp(valid);
  const cookieStore = await cookies();
  cookieStore.set('access_token', token);
  return NextResponse.json(user, { status: 201 });
});
