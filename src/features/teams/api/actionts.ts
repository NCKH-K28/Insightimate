import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { teamApi } from './http';
import { TeamList } from '@/contracts/teams';

export const deleteTeamMutationOptions = (orgId: string, teamId: string) => {
  return mutationOptions({
    mutationKey: ['orgs', orgId, 'teams', teamId, 'delete'],
    mutationFn: () => teamApi.delete({ orgId, teamId }),
    meta: { invalidateQueries: [['orgs', orgId, 'teams']] },
  });
};

export const createTeamMutationOptions = (orgId: string) => {
  return mutationOptions({
    mutationKey: ['orgs', orgId, 'teams', 'create'],
    mutationFn: (data: Parameters<typeof teamApi.create>[1]) => teamApi.create({ orgId }, data),
    meta: { invalidateQueries: [['orgs', orgId, 'teams']] },
  });
};

export const updateTeamMutationOptions = (orgId: string, teamId: string) => {
  return mutationOptions({
    mutationKey: ['orgs', orgId, 'teams', teamId, 'update'],
    mutationFn: (data: Parameters<typeof teamApi.update>[1]) => teamApi.update({ orgId, teamId }, data),
    meta: { invalidateQueries: [['orgs', orgId, 'teams'], ['orgs', orgId, 'teams', teamId]] },
  });
};

export const listTeamsQueryOptions = (orgId: string) => {
  return queryOptions({
    queryKey: ['orgs', orgId, 'teams'],
    queryFn: async () => {
      const res = await teamApi.list({ orgId });
      return res as TeamList;
    },
    select: (res) => res.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const getTeamQueryOptions = (orgId: string, teamId: string) => {
  return queryOptions({ queryKey: ['orgs', orgId, 'teams', teamId], queryFn: () => teamApi.get({ orgId, teamId }) });
};

export const listTeamLinksQueryOptions = (orgId: string, teamId: string) => {
  return queryOptions({
    queryKey: ['orgs', orgId, 'teams', teamId, 'links'],
    queryFn: () => teamApi.links.list({ orgId, teamId }),
    select: (res) =>
      (res as any).data as {
        type: string;
        id: string;
        subject: { value: string; label: string };
      }[], // FIXME: typing
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const addTeamMembershipMutationOptions = (orgId: string, teamId: string) => {
  return mutationOptions({
    mutationFn: (data: Parameters<typeof teamApi.member.add>[1]) =>
      teamApi.members.add({ orgId, teamId }, data),
    meta: { invalidateQueries: [['orgs', orgId, 'teams', teamId], ['orgs', orgId, 'teams']] },
  });
};

export const removeTeamMembershipMutationOptions = (ctx: { orgId: string; teamId: string; memberId: string }) => {
  return mutationOptions({
    mutationKey: ['orgs', ctx.orgId, 'teams', ctx.teamId, 'members', ctx.memberId, 'remove'],
    mutationFn: () => teamApi.members.remove(ctx),
    meta: { invalidateQueries: [['orgs', ctx.orgId, 'teams', ctx.teamId], ['orgs', ctx.orgId, 'teams']] },
  });
};

export const updateTeamMembershipMutationOptions = (ctx: { orgId: string; teamId: string; memberId: string }) => {
  return mutationOptions({
    mutationKey: ['orgs', ctx.orgId, 'teams', ctx.teamId, 'members', ctx.memberId, 'update'],
    mutationFn: (data: Parameters<typeof teamApi.members.update>[1]) =>
      teamApi.member.update(ctx, data),
    meta: { invalidateQueries: [['orgs', ctx.orgId, 'teams', ctx.teamId], ['orgs', ctx.orgId, 'teams']] },
  });
};
