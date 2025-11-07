import { NextRequest, NextResponse } from 'next/server';
import { search } from '@/features/query/server/cqrs/q-search-v2';
import { compose } from '@/lib/http/api-compose';
import { authenticatedV2, getAuthFromRequest } from '@/lib/auth';

export const GET = compose(authenticatedV2, async (request: NextRequest) => {
  try {
    const auth = await getAuthFromRequest(request);
    const actorId = auth.user.id;

    const q = request.nextUrl.searchParams.get('q') || '';

    const result = await search({ q, pagination: { size: 25 } }, { actorId });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ status: 'error', message: 'Search failed' }, { status: 500 });
  }
});
