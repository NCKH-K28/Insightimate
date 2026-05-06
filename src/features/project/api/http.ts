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
} from '@/contracts/project';
import { PathParams, baseApi } from '@/lib/api/_client';
import { type ProjectListOutput, type ProjectListInput } from '../server/cqrs/search-projects'; // FIXME: remove circular dependency

const BasePrj = `v3/projs` as const;
const PrjItem = `${BasePrj}/{projId}` as const;

const PrjIssues = `${PrjItem}/issues` as const;
const PrjIssueItem = `${PrjIssues}/{issueId}` as const;

export type PrjCtx = PathParams<typeof PrjItem>;
export type PrjIssueCtx = PathParams<typeof PrjIssueItem>;

const PrjEndpoints = {
  list: BasePrj,
  recent: `${BasePrj}/recent`,
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
    types: `${PrjItem}/issue-types`,
  },
  summary: {
    get: `${PrjItem}/summary`,
  },
} as const;

export const projectApi = {
  search: (input?: ProjectListInput) => {
    const url = `v3/projs/search`;
    return baseApi.get<ProjectListOutput>(url, undefined, { params: input });
  },
  list: (params?: ProjectQueryParams) =>
    baseApi.get<ProjectListRes>(PrjEndpoints.list, undefined, { params }),
  recent: () => baseApi.get<{ data: any[] }>(PrjEndpoints.recent),
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

  actors: {
    list: (ctx: PrjCtx) => baseApi.get<{ data: any[] }>(PrjEndpoints.actors.list, ctx),
    create: (ctx: PrjCtx, data: any) => baseApi.post(PrjEndpoints.actors.create, data, ctx),
    delete: (ctx: PrjCtx & { actorId: string }) => baseApi.delete(PrjEndpoints.actors.delete, ctx),
    update: (ctx: PrjCtx & { actorId: string }, data: any) =>
      baseApi.patch(PrjEndpoints.actors.update, data, ctx),
  },

  issueStatuses: {
    list: (ctx: PrjCtx) =>
      baseApi.get<{ items: any[]; total: number }>(PrjEndpoints.issueStatuses.list, ctx),
    create: (ctx: PrjCtx, data: any) => baseApi.post(PrjEndpoints.issueStatuses.create, data, ctx),
    delete: (ctx: PrjCtx, statusId: string) =>
      baseApi.delete(`${PrjEndpoints.issueStatuses.delete}?statusId=${statusId}`, ctx),
  },

  fields: {
    statuses: {
      list: (ctx: PrjCtx) =>
        baseApi.get<{ items: any[]; total: number }>(PrjEndpoints.fields.statuses, ctx),
    },
    priorities: {
      list: (ctx: PrjCtx) => baseApi.get<{ data: any[] }>(PrjEndpoints.fields.priorities, ctx),
    },
    types: {
      list: (ctx: PrjCtx) => baseApi.get<{ items: any[]; total: number }>(PrjEndpoints.fields.types, ctx),
      create: (ctx: PrjCtx, data: any) => baseApi.post(PrjEndpoints.fields.types, data, ctx),
      delete: (ctx: PrjCtx, typeId: string) => baseApi.delete(`${PrjEndpoints.fields.types}?typeId=${typeId}`, ctx),
    },
  },

  summary: { get: (ctx: PrjCtx) => baseApi.get<any>(PrjEndpoints.summary.get, ctx) },
};
