import { compose } from '@/lib/http/api-compose';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import z from 'zod';

const ZWsMember = z.object({
  userId: z.string(),
  user: z.object({ name: z.string(), avatarURL: z.string().optional() }),
});
export const ZWsActor = z.object({
  actorType: z.enum(['USER', 'TEAM']),
  actorId: z.string(),
  actor: z.object({
    name: z.string(),
    avatarURL: z.string().optional(),
    email: z.string().optional(),
    members: z.array(ZWsMember).optional(),
  }),
});
type WsActorType = z.infer<typeof ZWsActor>;

export const GET = compose<{ workspaceId: string }>(async (req) => {
  const { workspaceId } = req.params;
  const teams = await prisma.team.findMany({
    where: { workspaceId },
    include: { members: { include: { user: true } } },
  });

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: true },
  });
  const actors: WsActorType[] = [];

  teams.forEach((team) => {
    actors.push({
      actorType: 'TEAM',
      actorId: team.id,
      actor: {
        name: team.name,
        members: team.members.map((m) => ({ userId: m.userId, user: m.user })),
      },
    });
  });

  members.forEach((member) => {
    actors.push({
      actorType: 'USER',
      actorId: member.userId,
      actor: {
        name: member.user.name,
        avatarURL: member.user.avatar || undefined,
        email: member.user.email || undefined,
      },
    });
  });

  return NextResponse.json(actors);
});
