import { search } from '@/features/query/server/cqrs/q-search-v1';
import { ZSearchInput } from '@/contracts/query/schema-v1';
import { authenticatedV2 } from '@/lib/auth';
import { compose } from '@/lib/http/api-compose';
import { NextResponse } from 'next/server';

export const GET = compose(authenticatedV2, async (req) => {
  const query = ZSearchInput.parse(req.query);
  const result = await search(query, { actorId: 'system' }).catch((err) => {
    console.error('Error in search:', JSON.stringify(err, null, 2));
    throw err;
  });
  return NextResponse.json(result);
});
