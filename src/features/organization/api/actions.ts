import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { orgAPI } from './http';
import { OrgMemberInviteInput } from '@/contracts/organizations/organization.query';

export const orgKeys = {
  all: ['orgs'] as const,
  lists: () => [...orgKeys.all, 'list'] as const,
  details: () => [...orgKeys.all, 'detail'] as const,
  list: (filters: Record<string, any>) => [...orgKeys.lists(), { filters }] as const,
  detail: (params: { id: string; by?: 'id' | 'slug' }) =>
    [...orgKeys.details(), { params }] as const,
  members: {
    all: (orgId: string) => [...orgKeys.detail({ id: orgId }), 'members'] as const,
    lists: (orgId: string) => [...orgKeys.members.all(orgId), 'list'] as const,
  },
};

export const listOrgsQueryOptions = () => {
  return queryOptions({
    queryKey: orgKeys.lists(),
    queryFn: async () => orgAPI.list(),
    staleTime: 1000 * 60 * 5,
  });
};

export const getOrgQueryOptions = (params: { id: string; by?: 'id' | 'slug' }) => {
  return queryOptions({
    queryKey: orgKeys.detail(params),
    queryFn: async () => orgAPI.get(params.id, params.by),
    staleTime: 1000 * 60 * 5,
  });
};

export const listOrgsInviteesQueryOptions = () => {
  return queryOptions({
    queryKey: ['orgs', 'invitees'] as const,
    queryFn: orgAPI.me.invitees,
    staleTime: 1000 * 60 * 5,
  });
};

export const listOrgMembersQueryOptions = (orgId: string) => {
  return queryOptions({
    queryKey: orgKeys.members.lists(orgId),
    queryFn: async () => orgAPI.members.list(orgId),
    staleTime: 1000 * 60 * 5,
  });
};

export const inviteOrgMembersMutationOptions = (orgId: string) => {
  return mutationOptions({
    mutationFn: async (input: Omit<OrgMemberInviteInput, 'orgId'>) => {
      return orgAPI.members.invite({ orgId, ...input });
    },
  });
};
