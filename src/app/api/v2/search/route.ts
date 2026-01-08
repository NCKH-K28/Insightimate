import { NextRequest, NextResponse } from 'next/server';
import { search } from '@/features/query/server/cqrs/q-search-v2';
import { compose } from '@/lib/http/api-compose';
import { authenticatedV2, getAuthFromRequest } from '@/lib/auth/authn';
import { ZQueryParams } from '@/contracts/query/schema-v2';
import { getZodQuery, zodQueryPipe } from '@/lib/http/zod-pipes';

export const GET = compose(
  authenticatedV2,
  zodQueryPipe(ZQueryParams),
  async (request: NextRequest) => {
    try {
      const auth = await getAuthFromRequest(request);
      const actorId = auth.user.id;

      const input = getZodQuery(request, ZQueryParams);
      const result = await search(input, { actorId });
      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      console.error(error);
      return NextResponse.json({ status: 'error', message: 'Search failed' }, { status: 500 });
    }
  },
);
