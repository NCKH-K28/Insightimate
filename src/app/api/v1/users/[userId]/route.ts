import { NextRequest, NextResponse } from 'next/server';

type Context = { params: Promise<{ userId: string }> };
export async function GET(request: NextRequest, context: Context) {
  throw new Error('Not implemented');
}
