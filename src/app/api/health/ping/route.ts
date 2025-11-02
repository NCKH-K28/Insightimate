import { NextRequest } from 'next/server';

import {} from '@/features/agents/server/workers';

export async function GET(request: NextRequest) {
  return new Response('pong');
}
