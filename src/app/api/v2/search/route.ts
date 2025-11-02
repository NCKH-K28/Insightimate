import { NextRequest, NextResponse } from 'next/server';
import { search } from '@/features/query/server/cqrs/q-search-v2';

export const GET = async (request: NextRequest) => {
  try {
    const q = request.nextUrl.searchParams.get('q') || '';

    const result = await search({ q, pagination: { size: 25 } });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ status: 'error', message: 'Search failed' }, { status: 500 });
  }
};
