import { getOrgQueryOptions, listOrgsQueryOptions } from '@/features/organization/api/actions';
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { orgAPI } from '@/features/organization/api/http';
import { OrgCreateInput } from '@/contracts/organizations/organization.input';
import { OrgItem } from '@/contracts/organizations/organization.query';
import get from 'lodash/get';

export const useOrgs = () => {
  return useQuery(listOrgsQueryOptions());
};

export const useOrgsSuspense = () => {
  return useSuspenseQuery(listOrgsQueryOptions());
};

export const useOrg = (params: { id: string; by?: 'id' | 'slug' }) => {
  return useQuery(getOrgQueryOptions(params));
};

export const useOrgSuspense = (params: { id: string; by?: 'id' | 'slug' }) => {
  return useSuspenseQuery(getOrgQueryOptions(params));
};

export const useCreateOrg = () => {
  const qc = useQueryClient();

  //
  return useMutation({
    mutationFn: orgAPI.create,
    onMutate: async (newOrg: OrgCreateInput) => {
      await qc.cancelQueries(listOrgsQueryOptions());

      const tempId = `temp-id-${Date.now()}`;
      const optimistic: OrgItem = {
        ...newOrg,
        id: tempId,
        ownerId: 'loading',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const queryKey = listOrgsQueryOptions().queryKey;
      const previousOrgs = qc.getQueryData(queryKey);
      qc.setQueryData(queryKey, (old) => [optimistic, ...(old || [])]);
      return { previousOrgs, tempId };
    },
    onSuccess: async () => {
      await qc.invalidateQueries(listOrgsQueryOptions());
    },
    onError: (_err, _newOrg, context) => {
      const previousOrgs = get(context, 'previousOrgs', null);
      if (previousOrgs) {
        const queryKey = listOrgsQueryOptions().queryKey;
        qc.setQueryData(queryKey, previousOrgs);
      }
    },
  });
};

export const useDeleteOrg = (params: { id: string }) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => orgAPI.delete(params.id),
    onMutate: async () => {
      await qc.cancelQueries(listOrgsQueryOptions());

      const queryKey = listOrgsQueryOptions().queryKey;
      const previousOrgs = qc.getQueryData<OrgItem[]>(queryKey);
      qc.setQueryData<OrgItem[]>(queryKey, (old) =>
        (old || []).filter((org) => org.id !== params.id),
      );
      return { previousOrgs };
    },
    onError: (_err, _vars, context) => {
      const previousOrgs = get(context, 'previousOrgs', null);
      if (previousOrgs) {
        const queryKey = listOrgsQueryOptions().queryKey;
        qc.setQueryData(queryKey, previousOrgs);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries(listOrgsQueryOptions());
    },
  });
};

export const useUpdateOrg = (params: { id: string }) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<OrgCreateInput>) => orgAPI.update(params.id, data),
    onSuccess: async () => {
      await qc.invalidateQueries(getOrgQueryOptions({ id: params.id }));
      await qc.invalidateQueries(listOrgsQueryOptions());
    },
  });
};
