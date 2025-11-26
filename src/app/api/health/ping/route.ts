import { NextResponse } from 'next/server';

import {} from '@/features/agents/server/workers';

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
