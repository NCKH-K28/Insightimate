import axiosInstance from '@/lib/api/_client';
import { OrgCreateInput } from '@/contracts/organizations/organization.input';
import { OrgItem, ZOrgItem } from '@/contracts/organizations/organization.query';

const createOrg = async (data: OrgCreateInput): Promise<OrgItem> => {
  const resp = await axiosInstance.post('/v3/orgs', data);
  return ZOrgItem.parse(resp.data);
};

export const orgAPI = { create: createOrg };
