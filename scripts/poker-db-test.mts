// Minimal DB-level smoke test for Planning Poker schema.
// Bypasses @/lib/prisma (which has top-level await for health check).
import { PrismaClient } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

const genId = (p: string) => `${p}_${createId()}`;

async function main() {
  const userId = genId('user');
  const wsId = genId('ws');
  await prisma.user.create({ data: { id: userId, email: `${userId}@t.local`, name: 'T' } });
  await prisma.workspace.create({ data: { id: wsId, name: 'PT', ownerId: userId } });

  const session = await prisma.pokerSession.create({
    data: {
      id: genId('pks'),
      workspaceId: wsId,
      name: 'Sprint X',
      deckType: 'FIBONACCI',
      hostMode: 'ME',
      hostUserId: userId,
      creatorId: userId,
      inviteToken: createId(),
      status: 'DRAFT',
    },
  });
  console.log('session:', session.id, session.status);

  const story = await prisma.pokerStory.create({
    data: {
      id: genId('pst'),
      sessionId: session.id,
      code: 'JIRA-1',
      title: 'Login',
      priority: 'HIGH',
      position: 0,
      status: 'PENDING',
    },
  });
  console.log('story:', story.id);

  // Start: set active
  await prisma.pokerStory.update({ where: { id: story.id }, data: { status: 'VOTING' } });
  await prisma.pokerSession.update({
    where: { id: session.id },
    data: { activeStory: { connect: { id: story.id } }, status: 'ACTIVE' },
  });

  // Vote
  await prisma.pokerSessionParticipant.create({
    data: {
      id: genId('psp'),
      sessionId: session.id,
      userId,
      role: 'HOST',
      status: 'THINKING',
    },
  });
  const vote = await prisma.pokerVote.create({
    data: { id: genId('pkv'), storyId: story.id, userId, value: '5', confirmed: true },
  });
  console.log('vote:', vote.value, 'confirmed=', vote.confirmed);

  // Reveal
  const revealed = await prisma.pokerStory.update({
    where: { id: story.id },
    data: { status: 'ESTIMATED', finalPoints: 5, revealedAt: new Date(), estimatedAt: new Date() },
  });
  console.log('revealed finalPoints:', revealed.finalPoints);

  // Complete
  const done = await prisma.pokerSession.update({
    where: { id: session.id },
    data: { status: 'COMPLETED', endedAt: new Date(), activeStory: { disconnect: true } },
  });
  console.log('completed status:', done.status);

  // Read-back
  const full = await prisma.pokerSession.findUnique({
    where: { id: session.id },
    include: { stories: { include: { votes: true } }, participants: true },
  });
  console.log('full: stories=', full?.stories.length, 'participants=', full?.participants.length, 'votes=', full?.stories[0].votes.length);

  console.log('\n✅ DB schema works end-to-end');

  // Cleanup
  await prisma.pokerSession.delete({ where: { id: session.id } });
  await prisma.workspace.delete({ where: { id: wsId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌', e);
  await prisma.$disconnect();
  process.exit(1);
});
