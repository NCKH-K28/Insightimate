import { baseApi } from '@/lib/api';

const inviteUsers = async (
  params: { resourceType: 'WORKSPACE'; resourceId: string },
  data: { invitees: string[]; role: 'WS_ADMIN' | 'WS_MEMBER' },
) => {
  const response = await fetch('/api/v2/authz/invitations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, ...data }),
  });
  if (!response.ok) throw new Error('Failed to send invites');
  return response.json() as Promise<{ success: boolean }>;
};

const list = async (params: { resourceType: 'WORKSPACE'; resourceId: string }) => {
  const query = new URLSearchParams({
    resourceType: params.resourceType,
    resourceId: params.resourceId,
  }).toString();
  const response = await fetch(`/api/v2/authz/invitations?${query}`);
  if (!response.ok) throw new Error('Failed to fetch invites');
  return response.json() as Promise<{
    data: {
      id: string;
      user: { name: string; email: string; avatar: string };
      status: 'PENDING' | 'REJECTED';
      roleId: string;
      expiresAt: string;
    }[];
  }>;
};

const getInfo = async (token: string) => {
  const response = await fetch(`/api/v2/authz/invite?token=${token}`);
  if (!response.ok) throw new Error('Failed to fetch invite info');
  return response.json() as Promise<{
    resource: { id: string; name: string };
    inviter: { name: string; email: string; avatar: string };
    expiresAt: string;
  }>;
};

const searchCandidates = async (params: {
  search: string;
  resourceType: 'WORKSPACE' | 'TEAM' | 'PROJECT';
  resourceId: string;
}) => {
  const res = await baseApi.get<{
    data: { id: string; name: string; email?: string; avatar?: string }[];
  }>('/v2/authz/invite/candidates', {}, { params });
  return res;
};

const processInvite = async (data: { token: string; action: 'ACCEPT' | 'REJECT' }) => {
  const response = await fetch('/api/v2/authz/invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to process invite');
  return response.json() as Promise<{ success: boolean }>;
};

const resendInvite = async (inviteId: string) => {
  const response = await fetch(`/api/v2/authz/invitations/${inviteId}/resend`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to resend invite');
  return response.json() as Promise<{ success: boolean }>;
};

const revokeInvite = async (inviteId: string) => {
  const response = await fetch(`/api/v2/authz/invitations/${inviteId}/revoke`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to revoke invite');
  return response.json() as Promise<{ success: boolean }>;
};

export const inviteApi = {
  invite: inviteUsers,
  list,
  getInfo,
  searchCandidates,
  processInvite,
  resendInvite,
  revokeInvite,
};
