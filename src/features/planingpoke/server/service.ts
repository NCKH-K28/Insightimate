import { prisma } from '@/lib/prisma';
import { createId } from '@paralleldrive/cuid2';
import {
  PokerSessionCreateApiInput,
  PokerStoryBulkCreateInput,
  PokerStoryCreateInput,
  PokerStoryRevealInput,
  PokerSessionStartInput,
  PokerVoteSubmitInput,
} from '../types/inputs';
import { POKER_DECKS, PokerDeckType } from '../types';

type Ctx = { actorId: string };

const genId = (prefix: string) => `${prefix}_${createId()}`;

const ensureWorkspaceMember = async (workspaceId: string, userId: string) => {
  const isOwner = await prisma.workspace.findFirst({
    where: { id: workspaceId, ownerId: userId },
    select: { id: true },
  });
  if (isOwner) return;
  const m = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { id: true },
  });
  if (!m) throw new Error('Not a workspace member');
};

const ensureSessionAccess = async (sessionId: string, userId: string) => {
  const session = await prisma.pokerSession.findUnique({
    where: { id: sessionId },
    select: { workspaceId: true, hostUserId: true, creatorId: true },
  });
  if (!session) throw new Error('Session not found');
  await ensureWorkspaceMember(session.workspaceId, userId);
  return session;
};

const ensureSessionHost = async (sessionId: string, userId: string) => {
  const session = await prisma.pokerSession.findUnique({
    where: { id: sessionId },
    select: { workspaceId: true, hostUserId: true, creatorId: true },
  });
  if (!session) throw new Error('Session not found');
  if (session.hostUserId !== userId && session.creatorId !== userId) {
    throw new Error('Only host can perform this action');
  }
  return session;
};

// ============ SESSIONS =============

const createSession = async (input: PokerSessionCreateApiInput, ctx: Ctx) => {
  await ensureWorkspaceMember(input.workspaceId, ctx.actorId);

  const hostUserId =
    input.hostMode === 'ANOTHER' && input.hostUserId
      ? input.hostUserId
      : ctx.actorId;

  // Validate host is workspace member
  await ensureWorkspaceMember(input.workspaceId, hostUserId);

  const sessionId = genId('pks');
  const session = await prisma.pokerSession.create({
    data: {
      id: sessionId,
      workspaceId: input.workspaceId,
      name: input.name,
      deckType: input.deckType,
      hostMode: input.hostMode,
      hostUserId,
      creatorId: ctx.actorId,
      inviteToken: createId(),
      participants: {
        create: [
          {
            id: genId('psp'),
            userId: hostUserId,
            role: 'HOST',
          },
          ...(hostUserId !== ctx.actorId
            ? [{ id: genId('psp'), userId: ctx.actorId, role: 'VOTER' as const }]
            : []),
        ],
      },
    },
    include: {
      host: true,
      creator: true,
      participants: { include: { user: true } },
    },
  });
  return session;
};

const getSession = async (sessionId: string, ctx: Ctx) => {
  await ensureSessionAccess(sessionId, ctx.actorId);
  const session = await prisma.pokerSession.findUnique({
    where: { id: sessionId },
    include: {
      host: true,
      creator: true,
      workspace: { select: { id: true, name: true } },
      participants: { include: { user: true } },
      activeStory: { include: { votes: { include: { user: true } } } },
      _count: { select: { stories: true } },
    },
  });
  if (!session) throw new Error('Session not found');
  return session;
};

const listSessions = async (
  params: { workspaceId: string },
  ctx: Ctx,
) => {
  await ensureWorkspaceMember(params.workspaceId, ctx.actorId);
  const sessions = await prisma.pokerSession.findMany({
    where: { workspaceId: params.workspaceId },
    include: {
      host: true,
      creator: true,
      _count: { select: { stories: true, participants: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return { data: sessions, meta: { total: sessions.length } };
};

// ============ STORIES =============

const addStories = async (
  sessionId: string,
  input: PokerStoryBulkCreateInput,
  ctx: Ctx,
) => {
  await ensureSessionAccess(sessionId, ctx.actorId);
  const existing = await prisma.pokerStory.findMany({
    where: { sessionId },
    orderBy: { position: 'desc' },
    take: 1,
    select: { position: true },
  });
  let nextPos = (existing[0]?.position ?? -1) + 1;

  const result = await prisma.$transaction(
    input.stories.map((s) =>
      prisma.pokerStory.create({
        data: {
          id: genId('pst'),
          sessionId,
          code: s.code,
          title: s.title,
          description: s.description,
          priority: s.priority,
          tags: s.tags ?? [],
          issueId: s.issueId,
          position: nextPos++,
        },
      }),
    ),
  );
  return result;
};

const addStory = async (sessionId: string, input: PokerStoryCreateInput, ctx: Ctx) => {
  const list = await addStories(sessionId, { stories: [input] }, ctx);
  return list[0];
};

const listStories = async (sessionId: string, ctx: Ctx) => {
  await ensureSessionAccess(sessionId, ctx.actorId);
  const stories = await prisma.pokerStory.findMany({
    where: { sessionId },
    orderBy: { position: 'asc' },
    include: { _count: { select: { votes: true } } },
  });
  return { data: stories, meta: { total: stories.length } };
};

const removeStory = async (sessionId: string, storyId: string, ctx: Ctx) => {
  await ensureSessionHost(sessionId, ctx.actorId);
  await prisma.pokerStory.delete({ where: { id: storyId } });
  return { ok: true };
};

// ============ VOTING ROUND =============

const startSession = async (
  sessionId: string,
  input: PokerSessionStartInput,
  ctx: Ctx,
) => {
  await ensureSessionHost(sessionId, ctx.actorId);
  const story = await prisma.pokerStory.findFirst({
    where: { id: input.storyId, sessionId },
  });
  if (!story) throw new Error('Story not found in session');

  // Clear previous votes for that story (fresh round)
  await prisma.pokerVote.deleteMany({ where: { storyId: input.storyId } });

  const updated = await prisma.$transaction(async (tx) => {
    await tx.pokerStory.update({
      where: { id: input.storyId },
      data: { status: 'VOTING', revealedAt: null, finalPoints: null },
    });
    return tx.pokerSession.update({
      where: { id: sessionId },
      data: { status: 'ACTIVE', activeStory: { connect: { id: input.storyId } } },
      include: {
        host: true,
        creator: true,
        activeStory: { include: { votes: { include: { user: true } } } },
        participants: { include: { user: true } },
      },
    });
  });
  return updated;
};

const submitVote = async (
  sessionId: string,
  storyId: string,
  input: PokerVoteSubmitInput,
  ctx: Ctx,
) => {
  const session = await ensureSessionAccess(sessionId, ctx.actorId);
  const story = await prisma.pokerStory.findFirst({
    where: { id: storyId, sessionId },
  });
  if (!story) throw new Error('Story not found in session');

  // Validate value is in deck
  const sess = await prisma.pokerSession.findUnique({
    where: { id: sessionId },
    select: { deckType: true },
  });
  const deckType = (sess?.deckType ?? 'FIBONACCI') as PokerDeckType;
  const deck = POKER_DECKS[deckType];
  if (!deck.values.includes(input.value)) {
    throw new Error(`Invalid value "${input.value}" for deck ${deck.id}`);
  }
  void session;

  // Auto-add as participant if missing
  await prisma.pokerSessionParticipant.upsert({
    where: { sessionId_userId: { sessionId, userId: ctx.actorId } },
    update: { status: 'THINKING' },
    create: {
      id: genId('psp'),
      sessionId,
      userId: ctx.actorId,
      role: 'VOTER',
      status: 'THINKING',
    },
  });

  const vote = await prisma.pokerVote.upsert({
    where: { storyId_userId: { storyId, userId: ctx.actorId } },
    create: {
      id: genId('pkv'),
      storyId,
      userId: ctx.actorId,
      value: input.value,
      confirmed: false,
    },
    update: { value: input.value, confirmed: false },
    include: { user: true },
  });
  return vote;
};

const confirmVote = async (sessionId: string, storyId: string, ctx: Ctx) => {
  await ensureSessionAccess(sessionId, ctx.actorId);
  const vote = await prisma.pokerVote.update({
    where: { storyId_userId: { storyId, userId: ctx.actorId } },
    data: { confirmed: true },
    include: { user: true },
  });
  // Update participant status -> READY
  await prisma.pokerSessionParticipant.update({
    where: { sessionId_userId: { sessionId, userId: ctx.actorId } },
    data: { status: 'READY' },
  });
  return vote;
};

const clearVote = async (sessionId: string, storyId: string, ctx: Ctx) => {
  await ensureSessionAccess(sessionId, ctx.actorId);
  await prisma.pokerVote
    .delete({ where: { storyId_userId: { storyId, userId: ctx.actorId } } })
    .catch(() => undefined);
  await prisma.pokerSessionParticipant.update({
    where: { sessionId_userId: { sessionId, userId: ctx.actorId } },
    data: { status: 'IDLE' },
  });
  return { ok: true };
};

const revealStory = async (
  sessionId: string,
  storyId: string,
  input: PokerStoryRevealInput,
  ctx: Ctx,
) => {
  await ensureSessionHost(sessionId, ctx.actorId);

  const votes = await prisma.pokerVote.findMany({ where: { storyId } });
  let avgPoints: number | null = input.finalPoints ?? null;
  if (avgPoints == null) {
    const numeric: number[] = votes
      .map((v: { value: string }) => Number(v.value))
      .filter((n: number) => !Number.isNaN(n));
    if (numeric.length > 0) {
      avgPoints = Number(
        (numeric.reduce((a: number, b: number) => a + b, 0) / numeric.length).toFixed(2),
      );
    }
  }

  const story = await prisma.pokerStory.update({
    where: { id: storyId },
    data: {
      status: 'ESTIMATED',
      revealedAt: new Date(),
      estimatedAt: new Date(),
      finalPoints: avgPoints ?? undefined,
    },
    include: { votes: { include: { user: true } } },
  });
  return story;
};

const resetRound = async (sessionId: string, storyId: string, ctx: Ctx) => {
  await ensureSessionHost(sessionId, ctx.actorId);
  const story = await prisma.pokerStory.findFirst({
    where: { id: storyId, sessionId },
  });
  if (!story) throw new Error('Story not found in session');

  await prisma.pokerVote.deleteMany({ where: { storyId } });
  await prisma.pokerStory.update({
    where: { id: storyId },
    data: {
      status: 'VOTING',
      revealedAt: null,
      estimatedAt: null,
      finalPoints: null,
    },
  });
  await prisma.pokerSessionParticipant.updateMany({
    where: { sessionId },
    data: { status: 'THINKING' },
  });
  return prisma.pokerSession.findUnique({
    where: { id: sessionId },
    include: {
      host: true,
      creator: true,
      activeStory: { include: { votes: { include: { user: true } } } },
      participants: { include: { user: true } },
    },
  });
};

const completeSession = async (sessionId: string, ctx: Ctx) => {
  await ensureSessionHost(sessionId, ctx.actorId);
  return prisma.pokerSession.update({
    where: { id: sessionId },
    data: { status: 'COMPLETED', endedAt: new Date(), activeStory: { disconnect: true } },
  });
};

// ============ PARTICIPANTS =============

const joinSession = async (sessionId: string, ctx: Ctx) => {
  const session = await prisma.pokerSession.findUnique({
    where: { id: sessionId },
    select: { id: true, workspaceId: true },
  });
  if (!session) throw new Error('Session not found');
  await ensureWorkspaceMember(session.workspaceId, ctx.actorId);

  return prisma.pokerSessionParticipant.upsert({
    where: { sessionId_userId: { sessionId, userId: ctx.actorId } },
    update: {},
    create: {
      id: genId('psp'),
      sessionId,
      userId: ctx.actorId,
      role: 'VOTER',
    },
    include: { user: true },
  });
};

const listParticipants = async (sessionId: string, ctx: Ctx) => {
  await ensureSessionAccess(sessionId, ctx.actorId);
  const participants = await prisma.pokerSessionParticipant.findMany({
    where: { sessionId },
    include: { user: true },
    orderBy: { joinedAt: 'asc' },
  });
  return { data: participants, meta: { total: participants.length } };
};

// ============ HOST CANDIDATES =============

const listHostCandidates = async (workspaceId: string, ctx: Ctx) => {
  await ensureWorkspaceMember(workspaceId, ctx.actorId);
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      owner: { select: { id: true, name: true, email: true, avatar: true } },
      members: {
        select: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      },
    },
  });
  if (!ws) return { data: [], meta: { total: 0 } };

  const map = new Map<string, { id: string; name: string; email: string; avatar: string | null }>();
  if (ws.owner) map.set(ws.owner.id, ws.owner);
  for (const m of ws.members) map.set(m.user.id, m.user);
  const data = Array.from(map.values());
  return { data, meta: { total: data.length } };
};

export const planingPokeService = {
  createSession,
  getSession,
  listSessions,
  addStory,
  addStories,
  listStories,
  removeStory,
  startSession,
  submitVote,
  confirmVote,
  clearVote,
  revealStory,
  resetRound,
  completeSession,
  joinSession,
  listParticipants,
  listHostCandidates,
};
