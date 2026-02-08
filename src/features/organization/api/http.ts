import axiosInstance from '@/lib/api/_client';
import {
  OrgCreateInput,
  OrgInvitationCreateInput,
} from '@/contracts/organizations/organization.input';
import {
  OrgInvitationItem,
  OrgItem,
  OrgMemberInviteInput,
  OrgMemberItem,
} from '@/contracts/organizations/organization.query';
import { OrgInvitation } from '@/contracts/organizations/organization';

const getOrg = async (id: string, by: 'id' | 'slug' = 'id'): Promise<OrgItem> => {
  const path = by === 'slug' ? `/v3/orgs/${id}?by=slug` : `/v3/orgs/${id}`;
  const resp = await axiosInstance.get(path);
  const data = resp.data;
  return data as OrgItem;
};

const listOrgs = async (): Promise<OrgItem[]> => {
  const resp = await axiosInstance.get('/v3/orgs');
  const data = resp.data?.data ?? [];
  return data as OrgItem[];
};

const createOrg = async (data: OrgCreateInput): Promise<OrgItem> => {
  const resp = await axiosInstance.post('/v3/orgs', data);
  return resp.data as OrgItem;
};

const deleteOrg = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/v3/orgs/${id}`);
};

const updateOrg = async (id: string, data: Partial<OrgCreateInput>): Promise<OrgItem> => {
  const resp = await axiosInstance.patch(`/v3/orgs/${id}`, data);
  return resp.data as OrgItem;
};

const leaveOrg = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/v3/orgs/${id}/members/me`);
};

const listOrgMembers = async (orgId: string): Promise<OrgMemberItem[]> => {
  const resp = await axiosInstance.get(`/v3/orgs/${orgId}/members`);
  const data = resp.data?.data ?? resp.data;
  return data;
};

const inviteOrgMembers = async (input: OrgMemberInviteInput): Promise<void> => {
  await axiosInstance.post(`/v3/orgs/${input.orgId}/members/invite`, input);
};

const removeMember = async (orgId: string, userId: string): Promise<void> => {
  await axiosInstance.delete(`/v3/orgs/${orgId}/members/${userId}`);
};

const assignMemberRole = async (orgId: string, userId: string, role: string): Promise<void> => {
  await axiosInstance.patch(`/v3/orgs/${orgId}/members/${userId}`, { role });
};

const listInvitations = async (orgId: string): Promise<OrgInvitationItem[]> => {
  const resp = await axiosInstance.get(`/v3/orgs/${orgId}/invitations`);
  return resp.data?.data ?? [];
};

const revokeInvitation = async (orgId: string, email: string): Promise<void> => {
  await axiosInstance.post(`/v3/orgs/${orgId}/invitations/revoke`, { email });
};

const resendInvitation = async (orgId: string, email: string): Promise<void> => {
  await axiosInstance.post(`/v3/orgs/${orgId}/invitations/resend`, { email });
};

const acceptInvitation = async (token: string): Promise<{ ok: boolean; orgId: string }> => {
  const resp = await axiosInstance.post(`/v3/orgs/invitations/accept`, { token });
  return resp.data;
};

const previewInvitation = async (token: string): Promise<OrgInvitationItem> => {
  const resp = await axiosInstance.get(`/v3/orgs/invitations/preview?token=${token}`);
  return resp.data?.data;
};

const createOrgInvitation = async (input: OrgInvitationCreateInput): Promise<OrgInvitation> => {
  const orgId = input.orgId;
  const resp = await axiosInstance.post(`/v3/orgs/${orgId}/invitations`, input);
  return resp.data;
};

const listMyInvitations = async (): Promise<OrgInvitation[]> => {
  const resp = await axiosInstance.get('/v3/me/orgs/invitees');
  const data = resp.data?.data ?? [];
  return data as OrgInvitationItem[];
};

export const orgAPI = {
  list: listOrgs,
  get: getOrg,
  create: createOrg,
  delete: deleteOrg,
  update: updateOrg,

  members: {
    list: listOrgMembers,
    invite: inviteOrgMembers,
    remove: removeMember,
    assign: assignMemberRole,
  },

  invitations: {
    list: listInvitations,
    create: createOrgInvitation,
    listMy: listMyInvitations,
    revoke: revokeInvitation,
    resend: resendInvitation,
    accept: acceptInvitation,
    preview: previewInvitation,
  },

  me: { leave: leaveOrg, invitees: listMyInvitations },
};
