import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { ProjectQueryParams } from '@/contracts/project';
import { projectApi } from './http';
import { ProjectListInput } from '../server/cqrs/search-projects';

export const getProjectQueryOptions = (
  params: { projId: string } | { projectId: string; projId?: string },
) => {
  const projId = 'projId' in params ? params.projId : params.projectId;
  return queryOptions({
    queryKey: ['projects', projId],
    queryFn: async () => projectApi.get({ projId: projId as string }),
    staleTime: 1000 * 60 * 5,
  });
};

export const fetchProjectsQueryOptions = (params?: ProjectQueryParams) => {
  const _params = { ...params };
  return queryOptions({
    queryKey: ['projects', _params],
    queryFn: () => projectApi.list(_params),
    select: (res) => res.data,
  });
};

export const listProjectsQueryOptions = fetchProjectsQueryOptions;

export const searchProjectsQueryOptions = (input?: ProjectListInput) => {
  return queryOptions({
    queryKey: ['projects', 'search', input],
    queryFn: () => projectApi.search(input),
    select: (res) => res.data,
  });
};

export const fetchProjectFacetsQueryOptions = (params?: ProjectQueryParams) => {
  const _params = { ...params };
  return queryOptions({
    queryKey: ['projects', _params, 'facets'],
    queryFn: () => projectApi.getFacets(_params),
  });
};

export const fetchRecentProjectsQueryOptions = () =>
  queryOptions({
    queryKey: ['projects', 'recent'],
    queryFn: async () => projectApi.recent(),
    select: (res) => res.data,
  });

export const fetchProjectQueryOptions = (
  params: { projId: string } | { projectId: string; projId?: string },
) => {
  const projId = 'projId' in params ? params.projId : params.projectId;
  return queryOptions({
    queryKey: ['projects', projId],
    queryFn: async () => projectApi.get({ projId: projId as string }),
    staleTime: 1000 * 60 * 5,
  });
};

export const createProjectMutationOptions = () => {
  return mutationOptions({
    mutationKey: ['projects', 'create'],
    mutationFn: (data: Parameters<typeof projectApi.create>[0]) => projectApi.create(data),
    meta: { invalidateQueries: [['projects'], ['projects', 'facets']] },
  });
};

export const updateProjectMutationOptions = (params: { projId: string }) => {
  return mutationOptions({
    mutationKey: ['projects', params, 'update'],
    mutationFn: (data: Parameters<typeof projectApi.update>[1]) => projectApi.update(params, data),
    // onSuccess: (_, variables) => {
    //   queryClient.invalidateQueries({ queryKey: ['projects'] });
    //   queryClient.invalidateQueries({ queryKey: ['projects', 'facets'] });
    //   queryClient.invalidateQueries({ queryKey: ['projects', { projId: variables.id }] });
    // },
    meta: {
      invalidateQueries: [['projects'], ['projects', params.projId], ['projects', 'facets']],
    },
  });
};

export const deleteProjectMutationOptions = (params: { projId: string }) => {
  return mutationOptions({
    mutationKey: ['projects', params, 'delete'],
    mutationFn: () => projectApi.delete(params),
    meta: { invalidateQueries: [['projects'], ['projects', 'facets']] },

    // onSuccess: () => {
    //   queryClient.invalidateQueries({ queryKey: ['projects'] });
    //   queryClient.invalidateQueries({ queryKey: ['projects', 'facets'] });
    // },
  });
};

export const fetchProjectPermissionsQueryOptions = (params: { projId: string }) => {
  return queryOptions({
    queryKey: ['projects', params, 'permissions'],
    queryFn: async () => projectApi.permission.get(params),
    staleTime: 1000 * 60 * 5,
  });
};

export const createProjectRoleMutationOptions = (params: { projId: string }) => {
  return mutationOptions({
    mutationKey: ['projects', params, 'permissions', 'create'],
    mutationFn: (data: Parameters<typeof projectApi.permission.create>[1]) =>
      projectApi.permission.create(params, data),
    meta: { invalidateQueries: [['projects', params, 'permissions']] },
    // onSuccess: () => {
    //   queryClient.invalidateQueries({ queryKey: ['projects', params, 'permissions'] });
    // },
  });
};

export const listProjectRolesQueryOptions = (params: { projId: string }) => {
  return queryOptions({
    queryKey: ['projects', params, 'roles'],
    queryFn: async () => projectApi.role.list(params),
    select: (res) => res.data,
    staleTime: 1000 * 60 * 5,
  });
};

export const writeProjectRolesMutationOptions = (params: { projId: string }) => {
  return mutationOptions({
    mutationKey: ['projects', params, 'roles', 'write'],
    mutationFn: (data: Parameters<typeof projectApi.role.write>[1]) =>
      projectApi.role.write(params, data),
    meta: {
      invalidateQueries: [
        ['projects', params, 'roles'],
        ['projects', params, 'permissions'],
        ['projects', params, 'members'],
      ],
    },
  });
};

// project actors
export const listProjectActorsQueryOptions = (params: { projId: string }) => {
  return queryOptions({
    queryKey: ['projects', params, 'actors'],
    queryFn: async () => projectApi.actors.list(params),
    select: (res) => res.data,
    staleTime: 1000 * 60 * 5,
  });
};

export const listProjectMembersQueryOptions = (params: { projId: string }) => {
  return queryOptions({
    queryKey: ['projects', params.projId, 'actors'],
    queryFn: async () => projectApi.actors.list(params),
    select: (res) => res.data,
    staleTime: 1000 * 60 * 5,
  });
};

export const addProjectMemberMutationOptions = (params: { projId: string }) => {
  return mutationOptions({
    mutationKey: ['projects', params, 'actors', 'add'],
    mutationFn: (data: Parameters<typeof projectApi.actors.create>[1]) =>
      projectApi.actors.create(params, data),
    meta: { invalidateQueries: [['projects', params.projId, 'actors']] },
  });
};

export const deleteProjectMembersMutationOptions = (params: { projId: string }) => {
  return mutationOptions({
    mutationKey: ['projects', params, 'actors', 'delete'],
    mutationFn: ([actorId]: [string]) => projectApi.actors.delete({ ...params, actorId }),
    meta: { invalidateQueries: [['projects', params.projId, 'actors']] },
  });
};

export const updateProjectMembersMutationOptions = (params: { projId: string }) => {
  return mutationOptions({
    mutationKey: ['projects', params, 'actors', 'update'],
    mutationFn: ([{ id, ...data }]: [
      { id: string } & Parameters<typeof projectApi.actors.update>[1],
    ]) => projectApi.actors.update({ ...params, actorId: id }, data),
    meta: { invalidateQueries: [['projects', params.projId, 'actors']] },
  });
};

export const listProjectStatusesQueryOptions = (params: { projId: string }) => {
  return queryOptions({
    queryKey: ['projects', params.projId, 'fields', 'statuses'],
    queryFn: async () => projectApi.fields.statuses.list(params),
    staleTime: 1000 * 60 * 5,
  });
};

export const listProjectFieldTypesQueryOptions = (params: { projId: string }) => {
  return queryOptions({
    queryKey: ['projects', params.projId, 'fields', 'types'],
    queryFn: async () => projectApi.fields.types.list(params),
    staleTime: 1000 * 60 * 5,
  });
};

export const createProjectWorkTypeMutationOptions = (params: { projId: string }) => {
  return mutationOptions({
    mutationKey: ['projects', params.projId, 'fields', 'types', 'create'],
    mutationFn: (data: any) => projectApi.fields.types.create(params, data),
    meta: { invalidateQueries: [['projects', params.projId, 'fields', 'types']] },
  });
};

export const deleteProjectWorkTypeMutationOptions = (params: { projId: string }) => {
  return mutationOptions({
    mutationKey: ['projects', params.projId, 'fields', 'types', 'delete'],
    mutationFn: (typeId: string) => projectApi.fields.types.delete(params, typeId),
    meta: { invalidateQueries: [['projects', params.projId, 'fields', 'types']] },
  });
};

export const fetchProjectSummaryQueryOptions = (params: { projId: string }) => {
  return queryOptions({
    queryKey: ['projects', params.projId, 'summary'],
    queryFn: async () => projectApi.summary.get(params),
    staleTime: 1000 * 60 * 1,
  });
};

export const checkKeyAvailabilityQueryOptions = (params: { orgId: string; key: string }) => {
  return queryOptions({
    queryKey: ['projects', 'check-key', params],
    queryFn: async () => projectApi.checkKeyAvailability(params.orgId, params.key),
    enabled: params.key.length >= 2,
    staleTime: 1000 * 30,
  });
};
