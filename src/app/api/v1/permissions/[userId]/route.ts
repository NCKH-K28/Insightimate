import { httpExceptionFilter } from '@/lib/http/filters';
import { authenticated } from '@/lib/guards';
import { getUserPermissions } from '@/lib/services/old/permission';
import { NextRequest, NextResponse } from 'next/server';

type Context = { params: Promise<{ userId: string }> };
export async function GET(request: NextRequest, ctx: Context) {
  try {
    const auth = await authenticated(request, await ctx.params);
    const currentUserId = auth.user.id;

    const { userId } = await ctx.params;

    if (userId !== currentUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const sourceType = 'PROJECT';
    const sourceParam = 'someValue';

    if (sourceType !== 'PROJECT') throw new Error(`Not Implemented: ${sourceType}`);

    const perms = await getUserPermissions(userId, sourceParam);
    return NextResponse.json(perms, { status: 200 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
}
