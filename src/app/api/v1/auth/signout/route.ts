import { NextRequest, NextResponse } from 'next/server';
import { httpExceptionFilter } from '@/lib/http/filters';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('access_token');

    return NextResponse.json({ message: 'Signed out successfully' }, { status: 200 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
}
