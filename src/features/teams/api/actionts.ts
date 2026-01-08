import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { teamApi } from './http';
import { TeamList } from '@/contracts/teams';

export const deleteTeamMutationOptions = (teamId: string) => {
  return mutationOptions({
    mutationKey: ['teams', teamId, 'delete'],
    mutationFn: () => teamApi.delete({ teamId }),
    meta: { invalidateQueries: [['teams']] },
  });
};

export const createTeamMutationOptions = () => {
  return mutationOptions({
    mutationKey: ['teams', 'create'],
    mutationFn: (data: Parameters<typeof teamApi.create>[0]) => teamApi.create(data),
    // onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
    meta: { invalidateQueries: [['teams']] },
  });
};

export const updateTeamMutationOptions = (teamId: string) => {
  return mutationOptions({
    mutationKey: ['teams', teamId, 'update'],
    mutationFn: (data: Parameters<typeof teamApi.update>[1]) => teamApi.update({ teamId }, data),
    meta: { invalidateQueries: [['teams'], ['teams', teamId]] },
  });
};

export const listTeamsQueryOptions = () => {
  return queryOptions({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await teamApi.list();
      return res as TeamList;
    },
    select: (res) => res.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const getTeamQueryOptions = (teamId: string) => {
  return queryOptions({ queryKey: ['teams', teamId], queryFn: () => teamApi.get({ teamId }) });
};

export const listTeamLinksQueryOptions = (teamId: string) => {
  return queryOptions({
    queryKey: ['teams', teamId, 'links'],
    queryFn: () => teamApi.links.list({ teamId }),
    select: (res) =>
      (res as any).data as {
        type: string;
        id: string;
        subject: { value: string; label: string };
      }[], // FIXME: typing
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const addTeamMembershipMutationOptions = (teamId: string) => {
  return mutationOptions({
    mutationFn: (data: Parameters<typeof teamApi.member.add>[1]) =>
      teamApi.members.add({ teamId }, data),
    meta: { invalidateQueries: [['teams', teamId], ['teams']] },
  });
};

export const removeTeamMembershipMutationOptions = (ctx: { teamId: string; memberId: string }) => {
  return mutationOptions({
    mutationKey: ['teams', ctx.teamId, 'members', ctx.memberId, 'remove'],
    mutationFn: () => teamApi.members.remove(ctx),
    meta: { invalidateQueries: [['teams', ctx.teamId], ['teams']] },
  });
};

export const updateTeamMembershipMutationOptions = (ctx: { teamId: string; memberId: string }) => {
  return mutationOptions({
    mutationKey: ['teams', ctx.teamId, 'members', ctx.memberId, 'update'],
    mutationFn: (data: Parameters<typeof teamApi.members.update>[1]) =>
      teamApi.member.update(ctx, data),
    meta: { invalidateQueries: [['teams', ctx.teamId], ['teams']] },
  });
};
