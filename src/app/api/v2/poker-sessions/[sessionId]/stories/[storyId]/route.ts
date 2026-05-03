import {
  ZPokerStoryRevealInput,
  ZPokerVoteSubmitInput,
} from '@/features/planingpoke/types/inputs';
import { planingPokeService } from '@/features/planingpoke/server';
import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/auth';
import { authenticated } from '@/lib/auth/guards';
import { NextResponse } from 'next/server';

type Params = { sessionId: string; storyId: string };

export const DELETE = middlewareHandler<Params>([authenticated], async (req, { params }) => {
  const auth = await getAuthFromRequest(req);
  const result = await planingPokeService.removeStory(params.sessionId, params.storyId, {
    actorId: auth.user.id,
  });
  return NextResponse.json(result, { status: 200 });
});

// POST: submit/upsert vote
export const POST = middlewareHandler<Params>([authenticated], async (req, { params }) => {
  const auth = await getAuthFromRequest(req);
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  if (action === 'reveal') {
    const body = await req.json().catch(() => ({}));
    const input = ZPokerStoryRevealInput.parse(body ?? {});
    const story = await planingPokeService.revealStory(
      params.sessionId,
      params.storyId,
      input,
      { actorId: auth.user.id },
    );
    return NextResponse.json(story, { status: 200 });
  }

  if (action === 'confirm') {
    const vote = await planingPokeService.confirmVote(params.sessionId, params.storyId, {
      actorId: auth.user.id,
    });
    return NextResponse.json(vote, { status: 200 });
  }

  if (action === 'clear') {
    const result = await planingPokeService.clearVote(params.sessionId, params.storyId, {
      actorId: auth.user.id,
    });
    return NextResponse.json(result, { status: 200 });
  }

  if (action === 'reset') {
    const result = await planingPokeService.resetRound(params.sessionId, params.storyId, {
      actorId: auth.user.id,
    });
    return NextResponse.json(result, { status: 200 });
  }

  // default: submit vote value
  const body = await req.json();
  const input = ZPokerVoteSubmitInput.parse(body);
  const vote = await planingPokeService.submitVote(
    params.sessionId,
    params.storyId,
    input,
    { actorId: auth.user.id },
  );
  return NextResponse.json(vote, { status: 200 });
});
