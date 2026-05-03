import {
  ZPokerStoryBulkCreateInput,
  ZPokerStoryCreateInput,
} from '@/features/planingpoke/types/inputs';
import { planingPokeService } from '@/features/planingpoke/server';
import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/auth';
import { authenticated } from '@/lib/auth/guards';
import { NextResponse } from 'next/server';

type Params = { sessionId: string };

export const GET = middlewareHandler<Params>([authenticated], async (req, { params }) => {
  const auth = await getAuthFromRequest(req);
  const result = await planingPokeService.listStories(params.sessionId, {
    actorId: auth.user.id,
  });
  return NextResponse.json(result, { status: 200 });
});

export const POST = middlewareHandler<Params>([authenticated], async (req, { params }) => {
  const auth = await getAuthFromRequest(req);
  const body = await req.json();
  if (Array.isArray(body?.stories)) {
    const input = ZPokerStoryBulkCreateInput.parse(body);
    const result = await planingPokeService.addStories(params.sessionId, input, {
      actorId: auth.user.id,
    });
    return NextResponse.json({ data: result, meta: { total: result.length } }, { status: 201 });
  }
  const input = ZPokerStoryCreateInput.parse(body);
  const story = await planingPokeService.addStory(params.sessionId, input, {
    actorId: auth.user.id,
  });
  return NextResponse.json(story, { status: 201 });
});
