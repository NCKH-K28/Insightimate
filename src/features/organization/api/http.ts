import axiosInstance from '@/lib/api/_client';
import {
  OrgCreateInput,
  OrgInvitationCreateInput,
} from '@/contracts/organizations/organization.input';
import { OrgInvitationItem, OrgItem } from '@/contracts/organizations/organization.query';
import { OrgInvitation, OrgMember } from '@/contracts/organizations/organization';

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
  await axiosInstance.post(`/v3/me/orgs/${id}/leave`);
};

export const listOrgMembers = async (orgId: string): Promise<OrgMember[]> => {
  const resp = await axiosInstance.get(`/v3/orgs/${orgId}/members`);
  return resp.data?.data ?? [];
};

export const getOrgMember = async (orgId: string, userId: string): Promise<OrgMember> => {
  const resp = await axiosInstance.get(`/v3/orgs/${orgId}/members/${userId}`);
  return resp.data;
};

export const listInvitations = async (orgId: string): Promise<OrgInvitationItem[]> => {
  const resp = await axiosInstance.get(`/v3/orgs/${orgId}/invitations`);
  return resp.data?.data ?? [];
};

export const createOrgInvitation = async (
  input: OrgInvitationCreateInput,
): Promise<OrgInvitation> => {
  const orgId = input.orgId;
  const resp = await axiosInstance.post(`/v3/orgs/${orgId}/invitations`, input);
  return resp.data;
};

export const listMyInvitations = async (): Promise<OrgInvitation[]> => {
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

  members: { list: listOrgMembers },

  invitations: {
    list: listInvitations,
    create: createOrgInvitation,
    listMy: listMyInvitations,
  },

  me: { leave: leaveOrg, invitees: listMyInvitations },
};
