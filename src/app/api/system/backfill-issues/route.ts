import { backfillIssues } from '@/features/agents/server/ai-service';
import { compose } from '@/lib/http/api-compose';
import { NextResponse } from 'next/server';

// FIXME: migrate to
export const GET = compose(async (req) => {
  const query = req.query;
  const fetchSize = query.fetchSize ? parseInt(query.fetchSize as string, 10) : 200;
  const maxDocs = query.maxDocs ? parseInt(query.maxDocs as string, 10) : 500;

  const result = await backfillIssues({ fetchSize, maxDocs });

  return NextResponse.json(
    {
      ok: true,
      processed: result.processed,
      fetchSize,
      maxDocs,
      message: 'Backfill finished for this batch.',
    },
    { status: 200 },
  );
});
