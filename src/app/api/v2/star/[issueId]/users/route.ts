import { starService } from '@/features/issues/server/star.service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ issueId: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { issueId } = await params;
    const users = await starService.getStarredByUsers(issueId);

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('GET /api/v2/star/[issueId]/users error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
