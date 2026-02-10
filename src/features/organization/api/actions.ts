import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { orgAPI } from './http';
import { OrgMemberInviteInput } from '@/contracts/organization/organization.query';

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
  invitations: {
    all: (orgId: string) => [...orgKeys.detail({ id: orgId }), 'invitations'] as const,
    lists: (orgId: string) => [...orgKeys.invitations.all(orgId), 'list'] as const,
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

export const listOrgInvitationsQueryOptions = (orgId: string) => {
  return queryOptions({
    queryKey: orgKeys.invitations.lists(orgId),
    queryFn: async () => orgAPI.invitations.list(orgId),
    staleTime: 1000 * 60 * 5,
  });
};

export const getOrgInvitationPreviewQueryOptions = (token: string) => {
  return queryOptions({
    queryKey: ['orgs', 'invitations', 'preview', token] as const,
    queryFn: async () => orgAPI.invitations.preview(token),
    staleTime: Infinity, // Token content doesn't change unless expired
    enabled: token.length > 0,
  });
};

export const inviteOrgMembersMutationOptions = (orgId: string) => {
  return mutationOptions({
    mutationFn: async (input: Omit<OrgMemberInviteInput, 'orgId'>) => {
      return orgAPI.members.invite({ orgId, ...input });
    },
  });
};

export const revokeOrgInvitationMutationOptions = (orgId: string) => {
  return mutationOptions({
    mutationFn: async (email: string) => {
      return orgAPI.invitations.revoke(orgId, email);
    },
  });
};

export const resendOrgInvitationMutationOptions = (orgId: string) => {
  return mutationOptions({
    mutationFn: async (email: string) => {
      return orgAPI.invitations.resend(orgId, email);
    },
  });
};

export const acceptOrgInvitationMutationOptions = () => {
  return mutationOptions({
    mutationFn: async (token: string) => {
      return orgAPI.invitations.accept(token);
    },
  });
};

export const removeOrgMemberMutationOptions = (orgId: string) => {
  return mutationOptions({
    mutationFn: async (userId: string) => {
      return orgAPI.members.remove(orgId, userId);
    },
  });
};

export const assignOrgMemberRoleMutationOptions = (orgId: string) => {
  return mutationOptions({
    mutationFn: async (input: { userId: string; role: string }) => {
      return orgAPI.members.assign(orgId, input.userId, input.role);
    },
  });
};

export const leaveOrgMutationOptions = (orgId: string) => {
  return mutationOptions({
    mutationFn: async () => {
      return orgAPI.me.leave(orgId);
    },
  });
};
