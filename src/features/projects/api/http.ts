// import axiosInstance, { buildURL } from './_client';

// import {
//   Project,
//   ProjectCreateInput,
//   ProjectUpdateInput,
//   ProjectQueryParams,
//   ProjectList,
// } from '@/lib/schemas/project';
// import { projectMemberApi } from './project-member';
// import { projectPermissionApi } from './project-permission';
// import { issuePriorityApi } from './issue-priority';
// import { issueStatusApi } from './issue-status';
// import { issueTypeApi } from './issue-type';

// const ProjectURLs = {
//   get: 'projects/{projectId}',
//   list: 'projects',
//   create: 'projects',
//   delete: 'projects/{projectId}',
//   update: 'projects/{projectId}',
// };

// export const projectApi = {
//   get: (ctx: { projectId: string }) => {
//     return axiosInstance.get<Project>(buildURL(ProjectURLs.get, ctx));
//   },
//   list: (params?: ProjectQueryParams) => {
//     return axiosInstance.get<ProjectList>(ProjectURLs.list, { params });
//   },
//   create: (data: ProjectCreateInput) => {
//     return axiosInstance.post<Project>(ProjectURLs.create, data);
//   },
//   delete: (ctx: { projectId: string }) => {
//     return axiosInstance.delete<void>(buildURL(ProjectURLs.delete, ctx));
//   },
//   update: (ctx: { projectId: string }, data: ProjectUpdateInput) => {
//     return axiosInstance.patch<Project>(buildURL(ProjectURLs.update, ctx), data);
//   },

//   member: projectMemberApi,
//   permission: projectPermissionApi,
//   issueStatus: issueStatusApi,
//   issuePriority: issuePriorityApi,
//   issueType: issueTypeApi,
// };

// export default projectApi;
import {
  ProjectActorAddInput,
  ProjectCreateInput,
  ProjectFacets,
  ProjectItem,
  ProjectListRes,
  ProjectPermissionCreateInput,
  ProjectPermissionRes,
  ProjectPermissionUpdateInput,
  ProjectQueryParams,
  ProjectRole,
} from '@/contracts/projects';
import { PathParams, baseApi } from '@/lib/api/_client';

const BasePrj = `v2/projects` as const;
const PrjItem = `${BasePrj}/{projectId}` as const;

const PrjIssues = `${PrjItem}/issues` as const;
const PrjIssueItem = `${PrjIssues}/{issueId}` as const;

export type PrjCtx = PathParams<typeof PrjItem>;
export type PrjIssueCtx = PathParams<typeof PrjIssueItem>;

const PrjEndpoints = {
  list: BasePrj,
  create: BasePrj,
  get: PrjItem,
  delete: PrjItem,
  update: PrjItem,
  getFacets: `${BasePrj}/facets`,

  issue: {
    list: PrjIssues,
    get: PrjIssueItem,
    create: PrjIssues,
    delete: PrjIssueItem,
    update: PrjIssueItem,
    getMeta: `${PrjIssues}/meta`,
  },

  permission: {
    get: `${PrjItem}/permissions`,
    create: `${PrjItem}/permissions`,
    update: `${PrjItem}/permissions`,
  },

  role: {
    list: `${PrjItem}/roles`,
    create: `${PrjItem}/roles`,
    update: `${PrjItem}/roles/{roleId}`,
    delete: `${PrjItem}/roles/{roleId}`,
    write: `${PrjItem}/roles:write`,
  },

  member: {
    list: `${PrjItem}/members`,
    add: `${PrjItem}/members`,
    remove: `${PrjItem}/members/{memberId}`,
    update: `${PrjItem}/members/{memberId}`,
  },

  actors: {
    list: `${PrjItem}/actors`,
    create: `${PrjItem}/actors`,
    delete: `${PrjItem}/actors/{actorId}` as const,
    update: `${PrjItem}/actors/{actorId}` as const,
  },

  issueStatuses: {
    list: `${PrjItem}/issue-statuses`,
    create: `${PrjItem}/issue-statuses`,
    delete: `${PrjItem}/issue-statuses`,
  },

  fields: {
    statuses: `${PrjItem}/issue-statuses`, // Updated to use new endpoint
    priorities: `${PrjItem}/fields/priorities`,
    types: `${PrjItem}/fields/types`,
  },
} as const;

export const projectApi = {
  list: (params?: ProjectQueryParams) =>
    baseApi.get<ProjectListRes>(PrjEndpoints.list, undefined, { params }),
  create: (data: ProjectCreateInput) => baseApi.post<ProjectItem>(PrjEndpoints.create, data),
  getFacets: (params?: ProjectQueryParams) =>
    baseApi.get<ProjectFacets>(PrjEndpoints.getFacets, undefined, { params }),
  get: (ctx: PrjCtx) => baseApi.get<ProjectItem>(PrjEndpoints.get, ctx),
  delete: (ctx: PrjCtx) => baseApi.delete(PrjEndpoints.delete, ctx),
  update: (ctx: PrjCtx, data: any) => baseApi.patch<ProjectItem>(PrjEndpoints.update, data, ctx),

  issue: {
    list: (ctx: PrjCtx) => baseApi.get(PrjEndpoints.issue.list, ctx),
    get: (ctx: PrjIssueCtx) => baseApi.get(PrjEndpoints.issue.get, ctx),
    create: (ctx: PrjCtx, data: any) => baseApi.post(PrjEndpoints.issue.create, data, ctx),
    delete: (ctx: PrjIssueCtx) => baseApi.delete(PrjEndpoints.issue.delete, ctx),
    update: (ctx: PrjIssueCtx, data: any) => baseApi.put(PrjEndpoints.issue.update, data, ctx),
    getMeta: (ctx: PrjCtx) => baseApi.get(PrjEndpoints.issue.getMeta, ctx),
  },

  permission: {
    get: (ctx: PrjCtx) => baseApi.get<ProjectPermissionRes>(PrjEndpoints.permission.get, ctx),
    create: (ctx: PrjCtx, data: ProjectPermissionCreateInput) =>
      baseApi.post(PrjEndpoints.permission.create, data, ctx),
    update: (ctx: PrjCtx, data: ProjectPermissionUpdateInput) =>
      baseApi.put(PrjEndpoints.permission.update, data, ctx),
  },

  role: {
    list: (ctx: PrjCtx) => baseApi.get<{ data: ProjectRole[] }>(PrjEndpoints.role.list, ctx),
    create: (ctx: PrjCtx, data: any) => baseApi.post(PrjEndpoints.role.create, data, ctx),
    update: (ctx: PrjCtx & { roleId: string }, data: any) =>
      baseApi.put(PrjEndpoints.role.update, data, ctx),
    delete: (ctx: PrjCtx & { roleId: string }) => baseApi.delete(PrjEndpoints.role.delete, ctx),
    write: (ctx: PrjCtx, data: any) => baseApi.post(PrjEndpoints.role.write, data, ctx),
  },

  member: {
    list: (ctx: PrjCtx) => baseApi.get<{ data: any[] }>(PrjEndpoints.member.list, ctx),
    add: (ctx: PrjCtx, data: ProjectActorAddInput) =>
      baseApi.post(PrjEndpoints.member.add, data, ctx),
    remove: (ctx: PrjCtx & { memberId: string }) => baseApi.delete(PrjEndpoints.member.remove, ctx),
    update: (ctx: PrjCtx & { memberId: string }, data: { roleId: string }) =>
      baseApi.patch(PrjEndpoints.member.update, data, ctx),
  },

  actors: {
    list: (ctx: PrjCtx) => baseApi.get<{ data: any[] }>(PrjEndpoints.actors.list, ctx),
    create: (ctx: PrjCtx, data: any) => baseApi.post(PrjEndpoints.actors.create, data, ctx),
    delete: (ctx: PrjCtx & { actorId: string }) => baseApi.delete(PrjEndpoints.actors.delete, ctx),
    update: (ctx: PrjCtx & { actorId: string }, data: any) =>
      baseApi.put(PrjEndpoints.actors.update, data, ctx),
  },

  issueStatuses: {
    list: (ctx: PrjCtx) => baseApi.get<{ items: any[]; total: number }>(PrjEndpoints.issueStatuses.list, ctx),
    create: (ctx: PrjCtx, data: any) => baseApi.post(PrjEndpoints.issueStatuses.create, data, ctx),
    delete: (ctx: PrjCtx, statusId: string) => 
      baseApi.delete(`${PrjEndpoints.issueStatuses.delete}?statusId=${statusId}`, ctx),
  },

  fields: {
    statuses: {
      list: (ctx: PrjCtx) => baseApi.get<{ items: any[]; total: number }>(PrjEndpoints.fields.statuses, ctx),
    },
    priorities: {
      list: (ctx: PrjCtx) => baseApi.get<{ data: any[] }>(PrjEndpoints.fields.priorities, ctx),
    },
    types: {
      list: (ctx: PrjCtx) => baseApi.get<{ data: any[] }>(PrjEndpoints.fields.types, ctx),
    },
  },
};
