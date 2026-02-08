// @/lib/services/teams.service.ts
import { prisma } from '@/lib/prisma';
import { openfgaClient } from '@/lib/authz/clients/openfga';
import { createId } from '@paralleldrive/cuid2';
import { TeamCreateInput, TeamUpdateInput, ZTeamItem } from '@/contracts/teams';
import { workspaceService } from '@/features/workspaces/server/service';
import { buildTeamMemberTuples, buildTeamTuples } from '@/features/authz/api/tuple-factory';

type TeamServiceContext = { actorId: string };

const genTeamId = () => `team_${createId()}`;
const genMemberId = () => `tm_${createId()}`;

const ensureCanViewTeam = async (teamId: string, actorId: string) => {
  const canView = await openfgaClient.check({
    user: `user:${actorId}`,
    object: `team:${teamId}`,
    relation: 'can_view',
  });
  if (canView.allowed !== true) throw new Error('Permission denied');
};

const listTeams = async (input: unknown, context: TeamServiceContext) => {
  const { objects } = await openfgaClient.listObjects({
    type: 'team',
    user: `user:${context.actorId}`,
    relation: 'can_view',
  });
  const teamIds = objects.map((obj) => obj.replace('team:', ''));
  if (teamIds.length === 0) return { data: [], meta: { total: 0 } };

  const teams = await prisma.team.findMany({
    where: { id: { in: teamIds } },
    include: {
      members: { include: { user: true } },
      _count: { select: { members: true } },
    },
  });

  const parsed = teams.map((t) => ZTeamItem.parse(t));
  return { data: parsed, meta: { total: parsed.length } };
};

const createTeam = async (input: TeamCreateInput, context: TeamServiceContext) => {
  // That will ensure the user can create team in that workspace
  await workspaceService.getById(input.workspaceId, context);

  return prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: {
        id: genTeamId(),
        name: input.name,
        description: input.description,
        avatar: input.avatar,
        workspaceId: input.workspaceId,
        leadId: context.actorId,
      },
      include: { members: true },
    });

    const tuples = buildTeamTuples(team);
    await openfgaClient.writeTuples(tuples);

    return team;
  });
};

const getTeamById = async (
  teamId: string,
  context: TeamServiceContext,
  options?: { include: { members: boolean } },
) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: options?.include.members
      ? {
          members: { include: { user: true } },
          _count: { select: { members: true } },
        }
      : undefined,
  });
  if (!team) throw new Error('Team not found');
  await ensureCanViewTeam(teamId, context.actorId);

  const parsed = ZTeamItem.parse(team);
  return parsed;
};

const deleteTeamById = async (teamId: string, context: TeamServiceContext) => {
  await getTeamById(teamId, context);
  // FIXME: missing check permission
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.delete({ where: { id: teamId }, include: { members: true } });
    const tuples = buildTeamTuples(team);
    await openfgaClient.deleteTuples(tuples);
    return team;
  });
};

const updateTeam = async (input: TeamUpdateInput, context: TeamServiceContext) => {
  await getTeamById(input.id, context);
  // FIXME: missing check permission

  return prisma.$transaction(async (tx) => {
    const { id: teamId, ...rest } = input;
    const updated = await tx.team.update({ where: { id: teamId }, data: { ...rest } });
    return updated;
  });
};

const getMember = async (
  params: { teamId: string; memberId: string },
  context: TeamServiceContext,
) => {
  const team = await getTeamById(params.teamId, context, { include: { members: false } });
  if (!team) throw new Error('Team not found');
  await ensureCanViewTeam(params.teamId, context.actorId);
  const member = await prisma.teamMember.findUnique({
    where: { id: params.memberId },
    include: { user: true },
  });
  if (!member) throw new Error('Member not found');
  return member;
};

const addMember = async (
  params: { teamId: string; userId: string },
  context: TeamServiceContext,
) => {
  const team = await getTeamById(params.teamId, context);
  if (!team) throw new Error('Team not found');
  return prisma.$transaction(async (tx) => {
    const member = await tx.teamMember.create({
      data: {
        id: genMemberId(),
        userId: params.userId,
        teamId: params.teamId,
      },
    });
    const tuples = buildTeamMemberTuples(member);
    await openfgaClient.writeTuples(tuples);
    return member;
  });
};

const addMembers = async (
  params: { teamId: string; userIds: string[] },
  context: TeamServiceContext,
) => {
  const team = await getTeamById(params.teamId, context);
  if (!team) throw new Error('Team not found');
  return prisma.$transaction(async (tx) => {
    const members = await Promise.all(
      params.userIds.map((userId) =>
        tx.teamMember.create({
          data: {
            id: genMemberId(),
            userId,
            teamId: params.teamId,
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
  params: { teamId: string; memberId: string },
  context: TeamServiceContext,
) => {
  const team = await getTeamById(params.teamId, context, { include: { members: false } });
  if (!team) throw new Error('Team not found');
  return prisma.$transaction(async (tx) => {
    const member = await tx.teamMember.findUnique({
      where: { id: params.memberId },
      select: { id: true, userId: true, teamId: true },
    });
    if (!member) throw new Error('Member not found');
    await tx.teamMember.delete({ where: { id: params.memberId } });
    const tuples = buildTeamMemberTuples(member);
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
