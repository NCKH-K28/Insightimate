import axiosInstance from '@/lib/api/_client';
import { OrgCreateInput } from '@/contracts/organizations/organization.input';
import { OrgItem } from '@/contracts/organizations/organization.query';

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

export const orgAPI = {
  list: listOrgs,
  get: getOrg,
  create: createOrg,
  delete: deleteOrg,
  update: updateOrg,
};
