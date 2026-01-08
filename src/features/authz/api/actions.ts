import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { inviteApi } from './http';

export const getInviteInfoQueryOptions = (token: string) => {
  return queryOptions({
    queryKey: ['inviteInfo', token],
    queryFn: async () => {
      return inviteApi.getInfo(token);
    },
  });
};

export const acceptInviteMutionOptions = (_token?: string) => {
  return mutationOptions({
    mutationFn: async (token?: string) => {
      if (!token) throw new Error('Token is required');
      return inviteApi.processInvite({ token, action: 'ACCEPT' });
    },
  });
};

export const rejectInviteMutionOptions = (_token?: string) => {
  return mutationOptions({
    mutationFn: async (token?: string) => {
      if (!token) throw new Error('Token is required');
      return inviteApi.processInvite({ token, action: 'REJECT' });
    },
  });
};

export const listInvitesQueryOptions = (params: {
  resourceType: 'WORKSPACE';
  resourceId: string;
}) => {
  return queryOptions({
    queryKey: ['invites', params],
    queryFn: async () => {
      return inviteApi.list(params);
    },
    select: (res) => res.data,
  });
};

export const inviteMutationOptions = (params: {
  resourceType: 'WORKSPACE';
  resourceId: string;
}) => {
  return mutationOptions({
    mutationKey: ['invite', params],
    mutationFn: async (data: { invitees: string[]; role: 'WS_ADMIN' | 'WS_MEMBER' }) => {
      return inviteApi.invite(params, data);
    },
    meta: { invalidateQueries: [['invites', params], ['workspaces']] },
  });
};

export const searchInviteCandidatesQueryOptions = (
  search: string,
  params: { resourceType: 'WORKSPACE' | 'TEAM' | 'PROJECT'; resourceId: string },
) => {
  return queryOptions({
    queryKey: ['inviteCandidates', 'search', search],
    queryFn: () => inviteApi.searchCandidates({ search, ...params }),
    select: (res) => res.data,
    enabled: search.length > 0,
  });
};

export const processInviteMutationOptions = (token?: string) => {
  return mutationOptions({
    mutationFn: async (data: { action: 'ACCEPT' | 'REJECT'; token?: string }) => {
      const _token = data.token || token;
      if (!_token) throw new Error('Token is required');
      return inviteApi.processInvite({ token: _token, action: data.action });
    },
  });
};

export const resendInviteMutationOptions = (params: {
  workspaceId: string;
  invitationId: string;
}) => {
  const inviteId = params.invitationId;
  return mutationOptions({
    mutationKey: ['resendInvite', inviteId],
    mutationFn: async () => {
      return inviteApi.resendInvite(inviteId);
    },
    meta: { invalidateQueries: [['invites']] },
  });
};

export const revokeInviteMutationOptions = (params: {
  workspaceId: string;
  invitationId: string;
}) => {
  return mutationOptions({
    mutationKey: ['revokeInvite', params.invitationId],
    mutationFn: async () => {
      return inviteApi.revokeInvite(params.invitationId);
    },
    meta: { invalidateQueries: [['invites']] },
  });
};
