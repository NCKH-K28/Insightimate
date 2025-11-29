import {
  ZMemberInviteInput,
  ZWorkspaceItem,
  ZWorkspaceListRes,
  ZWsMemberListRes,
  ZWsProjectCreateInput,
} from '@/contracts/workspaces';
import { ZProjectFacets, ZProjectItem, ZProjectListRes } from '@/contracts/projects';
import { buildApi, ConfigTree } from '@/lib/api/_buildapi';

const WORKSPACE_BASE = 'v2/workspaces' as const;
const WORKSPACE_ITEM = `${WORKSPACE_BASE}/{workspaceId}` as const;

const WORKSPACE_MEMBER_BASE = `${WORKSPACE_ITEM}/members` as const;
const WORKSPACE_MEMBER_ITEM = `${WORKSPACE_MEMBER_BASE}/{memberId}` as const;

const WORKSPACE_PROJECT_BASE = `${WORKSPACE_ITEM}/projects` as const;
const WORKSPACE_PROJECT_ITEM = `${WORKSPACE_PROJECT_BASE}/{projectId}` as const;

const MemberEndpoints = {
  list: { path: WORKSPACE_MEMBER_BASE, method: 'get', schemas: { response: ZWsMemberListRes } },
  get: { path: WORKSPACE_MEMBER_ITEM, method: 'get' },
  delete: { path: WORKSPACE_MEMBER_ITEM, method: 'delete' },
  update: { path: WORKSPACE_MEMBER_ITEM, method: 'put' },
  invite: {
    method: 'post',
    path: `${WORKSPACE_MEMBER_BASE}:invite` as const,
    schemas: { body: ZMemberInviteInput },
  },
  assignRole: { path: `${WORKSPACE_MEMBER_ITEM}/assign_role`, method: 'patch' },
} satisfies ConfigTree;

const ProjectEndpoints = {
  list: { path: WORKSPACE_PROJECT_BASE, method: 'get', schemas: { response: ZProjectListRes } },
  getFacets: {
    path: `${WORKSPACE_PROJECT_BASE}/facets`,
    method: 'get',
    schemas: { response: ZProjectFacets },
  },
  get: { path: WORKSPACE_PROJECT_ITEM, method: 'get' },
  create: {
    path: WORKSPACE_PROJECT_BASE,
    method: 'post',
    schemas: { body: ZWsProjectCreateInput, response: ZProjectItem },
  },
  delete: { path: WORKSPACE_PROJECT_ITEM, method: 'delete' },
  update: { path: WORKSPACE_PROJECT_ITEM, method: 'put' },
} satisfies ConfigTree;

const WorkspaceEndpoints = {
  get: { path: WORKSPACE_ITEM, method: 'get', schemas: { response: ZWorkspaceItem } },
  list: { path: WORKSPACE_BASE, method: 'get', schemas: { response: ZWorkspaceListRes } },
  create: {
    path: WORKSPACE_BASE,
    method: 'post',
    schemas: { body: ZWorkspaceItem, response: ZWorkspaceItem },
  },
  delete: { path: WORKSPACE_ITEM, method: 'delete' },
  update: { path: WORKSPACE_ITEM, method: 'patch', schemas: { body: ZWorkspaceItem } },
  archive: { path: `${WORKSPACE_ITEM}/archive`, method: 'post' },
  unarchive: { path: `${WORKSPACE_ITEM}/unarchive`, method: 'post' },

  // === sub-resources ===
  member: MemberEndpoints,
  project: ProjectEndpoints,

  members: MemberEndpoints,
  projects: ProjectEndpoints,
} satisfies ConfigTree;

export const workspaceApi = buildApi(WorkspaceEndpoints);
