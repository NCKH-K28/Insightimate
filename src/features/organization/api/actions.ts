import { OrgItem } from '@/contracts/organizations/organization.query';
import axiosInstance from '@/lib/api/_client';
import { queryOptions } from '@tanstack/react-query';

export const getOrgQueryOptions = (params: { id: string; by?: 'id' | 'slug' }) => {
  return queryOptions({
    queryKey: ['orgs', params.id],
    queryFn: async () => {
      const path = params.by === 'slug' ? `/v3/orgs/${params.id}?by=slug` : `/v3/orgs/${params.id}`;
      const { data } = await axiosInstance.get(path);
      return data.data as OrgItem;
    },
    staleTime: 1000 * 60 * 5,
  });
};
