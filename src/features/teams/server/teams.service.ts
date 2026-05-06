import { prisma } from '@/lib/prisma';
import { openfgaClient } from '@/lib/authz/clients/openfga';
import { createId } from '@paralleldrive/cuid2';
import { TeamCreateInput, TeamUpdateInput, ZTeamItem } from '@/contracts/teams';
import { ensureCan } from '@/features/organization/utils/authz';
import { buildTeamMemberTuples, buildTeamTuples } from '@/lib/authz/tuple-factory';

export type TeamServiceContext = { actorId: string; orgId: string };

const genTeamId = () => `team_${createId()}`;

const ensureTeamAccess = async (teamId: string, actorId: string, relation: 'read' | 'manage') => {
  const check = await openfgaClient.check({
    user: `user:${actorId}`,
    object: `team:${teamId}`,
    relation,
  });
  if (check.allowed !== true) throw new Error('Permission denied');
};

const mapPrismaTeamToZTeamItem = (t: any) => {
  return ZTeamItem.parse({
    ...t,
    members: t.memberships,
    _count: t._count ? { members: t._count.memberships } : undefined,
  });
};

const listTeams = async (input: unknown, context: TeamServiceContext) => {
  const { objects } = await openfgaClient.listObjects({
    type: 'team',
    user: `user:${context.actorId}`,
    relation: 'read',
  });
  const teamIds = objects.map((obj) => obj.replace('team:', ''));
  if (teamIds.length === 0) return { data: [], meta: { total: 0 } };

  const teams = await prisma.team.findMany({
    where: { 
      id: { in: teamIds },
      orgId: context.orgId,
    },
    include: {
      memberships: { include: { user: true } },
      _count: { select: { memberships: true } },
    },
  });

  const parsed = teams.map(mapPrismaTeamToZTeamItem);
  return { data: parsed, meta: { total: parsed.length } };
};

const createTeam = async (input: TeamCreateInput, context: TeamServiceContext) => {
  await ensureCan('read', { kind: 'org', id: context.orgId, attr: { orgId: context.orgId } }, { actorId: context.actorId });

  return prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: {
        id: genTeamId(),
        name: input.name,
        description: input.description,
        avatar: input.avatar,
        orgId: context.orgId,
        leadId: context.actorId,
      },
      include: { memberships: true },
    });

    const tuples = buildTeamTuples({
      id: team.id,
      orgId: team.orgId,
      leadId: team.leadId!,
      members: [],
    });
    await openfgaClient.writeTuples(tuples);

    return mapPrismaTeamToZTeamItem(team);
  });
};

const getTeamById = async (
  teamId: string,
  context: TeamServiceContext,
  options?: { include: { members: boolean } },
) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId, orgId: context.orgId },
    include: options?.include.members
      ? {
          memberships: { include: { user: true } },
          _count: { select: { memberships: true } },
        }
      : undefined,
  });
  if (!team) throw new Error('Team not found');
  await ensureTeamAccess(teamId, context.actorId, 'read');

  return mapPrismaTeamToZTeamItem(team);
};

const deleteTeamById = async (teamId: string, context: TeamServiceContext) => {
  const teamInfo = await prisma.team.findUnique({ where: { id: teamId }, include: { memberships: true } });
  if (!teamInfo || teamInfo.orgId !== context.orgId) throw new Error('Team not found');
  
  await ensureTeamAccess(teamId, context.actorId, 'manage');
  
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.delete({ where: { id: teamId }, include: { memberships: true } });
    const tuples = buildTeamTuples({
      id: team.id,
      orgId: team.orgId,
      leadId: team.leadId!,
      members: team.memberships.map((m: any) => ({ userId: m.userId, teamId: m.teamId })),
    });
    await openfgaClient.deleteTuples(tuples);
    return mapPrismaTeamToZTeamItem(team);
  });
};

const updateTeam = async (teamId: string, input: TeamUpdateInput, context: TeamServiceContext) => {
  await getTeamById(teamId, context);
  await ensureTeamAccess(teamId, context.actorId, 'manage');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.team.update({ where: { id: teamId }, data: { ...input } });
    return mapPrismaTeamToZTeamItem(updated);
  });
};

const getMember = async (
  teamId: string,
  userId: string,
  context: TeamServiceContext,
) => {
  await getTeamById(teamId, context, { include: { members: false } });
  
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    include: { user: true },
  });
  if (!member) throw new Error('Member not found');
  return member;
};

const addMember = async (
  teamId: string,
  userId: string,
  context: TeamServiceContext,
) => {
  await getTeamById(teamId, context);
  await ensureTeamAccess(teamId, context.actorId, 'manage');

  return prisma.$transaction(async (tx) => {
    const member = await tx.teamMember.create({
      data: {
        userId,
        teamId,
      },
    });
    const tuples = buildTeamMemberTuples(member);
    await openfgaClient.writeTuples(tuples);
    return member;
  });
};

const addMembers = async (
  teamId: string,
  userIds: string[],
  context: TeamServiceContext,
) => {
  await getTeamById(teamId, context);
  await ensureTeamAccess(teamId, context.actorId, 'manage');

  return prisma.$transaction(async (tx) => {
    const members = await Promise.all(
      userIds.map((userId) =>
        tx.teamMember.create({
          data: {
            userId,
            teamId,
          },
        }),
      ),
    );
    const tuples = members.flatMap(buildTeamMemberTuples);
    await openfgaClient.writeTuples(tuples);
    return members;
  });
};

const removeMember = async (
  teamId: string,
  userId: string, 
  context: TeamServiceContext,
) => {
  await getTeamById(teamId, context, { include: { members: false } });
  await ensureTeamAccess(teamId, context.actorId, 'manage');

  return prisma.$transaction(async (tx) => {
    const member = await tx.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
      select: { teamId: true, userId: true },
    });
    if (!member) throw new Error('Member not found');
    
    await tx.teamMember.delete({ where: { teamId_userId: { teamId, userId } } });
    
    const tuples = buildTeamMemberTuples({ teamId, userId });
    await openfgaClient.deleteTuples(tuples);
    return member;
  });
};

export const teamsService = {
  listTeams,
  createTeam,
  updateTeam,
  getTeamById,
  deleteTeamById,

  getMember,
  addMember,
  addMembers,
  removeMember,
};
