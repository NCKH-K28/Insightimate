import { inviteService } from '@/features/authz/server';
import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';

const ZCandidateSearchParams = z.object({
  search: z.string().optional().default(''),
  resourceType: z.enum(['WORKSPACE', 'TEAM', 'PROJECT']),
  resourceId: z.string().min(1),
});

export const GET = async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const parsed = ZCandidateSearchParams.safeParse({
    search: searchParams.get('search'),
    resourceType: searchParams.get('resourceType'),
    resourceId: searchParams.get('resourceId'),
  });

  if (!parsed.success) {
    return new Response('Invalid parameters', { status: 400 });
  }

  const { search, resourceType, resourceId } = parsed.data;

  const result = await inviteService.searchCandidates(search, {
    id: resourceId,
    type: resourceType,
  });

  return NextResponse.json(result);
};
