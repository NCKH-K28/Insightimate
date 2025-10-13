import { mutationOptions, queryOptions, useQueryClient } from '@tanstack/react-query';
import { ProjectQueryParams } from '@/contracts/projects';
import { projectApi } from './http';

export const getProjectQueryOptions = (params: { projectId: string }) => {
  return queryOptions({
    queryKey: ['projects', params.projectId],
    queryFn: async () => projectApi.get(params),
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

export const fetchProjectFacetsQueryOptions = (params?: ProjectQueryParams) => {
  const _params = { ...params };
  return queryOptions({
    queryKey: ['projects', _params, 'facets'],
    queryFn: () => projectApi.getFacets(_params),
  });
};

export const fetchProjectQueryOptions = (params: { projectId: string }) => {
  return queryOptions({
    queryKey: ['projects', params.projectId],
    queryFn: async () => projectApi.get(params),
    staleTime: 1000 * 60 * 5,
  });
};

export const createProjectMutationOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationKey: ['projects', 'create'],
    mutationFn: (data: Parameters<typeof projectApi.create>[0]) => projectApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'facets'] });
    },
  });
};

export const updateProjectMutationOptions = (params: { projectId: string }) => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationKey: ['projects', params, 'update'],
    mutationFn: (data: Parameters<typeof projectApi.update>[1]) => projectApi.update(params, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'facets'] });
      queryClient.invalidateQueries({ queryKey: ['projects', { projectId: variables.id }] });
    },
  });
};

export const deleteProjectMutationOptions = (params: { projectId: string }) => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationKey: ['projects', params, 'delete'],
    mutationFn: () => projectApi.delete(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'facets'] });
    },
  });
};

export const fetchProjectPermissionsQueryOptions = (params: { projectId: string }) => {
  return queryOptions({
    queryKey: ['projects', params, 'permissions'],
    queryFn: async () => projectApi.permission.get(params),
    staleTime: 1000 * 60 * 5,
  });
};

export const createProjectRoleMutationOptions = (params: { projectId: string }) => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationKey: ['projects', params, 'permissions', 'create'],
    mutationFn: (data: Parameters<typeof projectApi.permission.create>[1]) =>
      projectApi.permission.create(params, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', params, 'permissions'] });
    },
  });
};

export const listProjectRolesQueryOptions = (params: { projectId: string }) => {
  return queryOptions({
    queryKey: ['projects', params, 'roles'],
    queryFn: async () => projectApi.role.list(params),
    select: (res) => res.data,
    staleTime: 1000 * 60 * 5,
  });
};

export const writeProjectRolesMutationOptions = (params: { projectId: string }) => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationKey: ['projects', params, 'roles', 'write'],
    mutationFn: (data: Parameters<typeof projectApi.role.write>[1]) =>
      projectApi.role.write(params, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', params, 'roles'] });
      queryClient.invalidateQueries({ queryKey: ['projects', params, 'permissions'] });
      queryClient.invalidateQueries({ queryKey: ['projects', params, 'members'] });
    },
  });
};

// project actors
export const listProjectActorsQueryOptions = (params: { projectId: string }) => {
  return queryOptions({
    queryKey: ['projects', params, 'actors'],
    queryFn: async () => projectApi.actors.list(params),
    select: (res) => res.data,
    staleTime: 1000 * 60 * 5,
  });
};

export const listProjectMembersQueryOptions = (params: { projectId: string }) => {
  return queryOptions({
    queryKey: ['projects', params.projectId, 'actors'],
    queryFn: async () => projectApi.member.list(params),
    select: (res) => res.data,
    staleTime: 1000 * 60 * 5,
  });
};

export const addProjectMemberMutationOptions = (params: { projectId: string }) => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationKey: ['projects', params, 'members', 'add'],
    mutationFn: (data: Parameters<typeof projectApi.member.add>[1]) =>
      projectApi.member.add(params, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', params.projectId, 'actors'] });
    },
  });
};

export const deleteProjectMembersMutationOptions = (params: { projectId: string }) => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationKey: ['projects', params, 'members', 'delete'],
    mutationFn: ([memberId]: [string]) => projectApi.member.remove({ ...params, memberId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', params.projectId, 'actors'] });
    },
  });
};

export const updateProjectMembersMutationOptions = (params: { projectId: string }) => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationKey: ['projects', params, 'members', 'update'],
    mutationFn: ([{ id, ...data }]: [
      { id: string } & Parameters<typeof projectApi.member.update>[1],
    ]) => projectApi.member.update({ ...params, memberId: id }, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', params.projectId, 'actors'] });
    },
  });
};

// project fields
export const listProjectStatusesQueryOptions = (params: { projectId: string }) => {
  return queryOptions({
    queryKey: ['projects', params.projectId, 'fields', 'statuses'],
    queryFn: async () => projectApi.fields.statuses.list(params),
    select: (res) => res.data,
    staleTime: 1000 * 60 * 5,
  });
};
