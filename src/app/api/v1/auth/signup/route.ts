import { NextRequest, NextResponse } from 'next/server';
import { SignUpSchema } from '../../../../../../.temp/schemas/auth';
import { httpExceptionFilter } from '@/lib/http/filters';
import { cookies } from 'next/headers';
import { authSignup } from '@/lib/services/auth';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const valid = SignUpSchema.parse(body);

    const user = await authSignup(valid);

    const cookieStore = await cookies();
    const accessToken = await generateToken({ sub: user.id, email: user.email });
    cookieStore.set('access_token', accessToken);

    return NextResponse.json({ message: 'Sign up successful' }, { status: 201 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
}
