import { TupleKey } from '@openfga/sdk';

const R = { PARENT: 'parent', CHILD: 'child', GRANTS: 'grants' } as const;

type ProjectRoleId = string;
type ProjectId = string;
type WorkspaceId = string;
type UserId = string;

const asUser = (id: UserId) => `user:${id}`;
const asWs = (id: WorkspaceId) => `workspace:${id}`;
const asTeam = (id: string) => `team:${id}`;
const asProj = (id: ProjectId) => `project:${id}`;
// const asProjPerm = (projectId: string, perm: string) => `project_permission:${projectId}:${perm}`;
const asProjRole = (id: ProjectRoleId) => `project_role:${id}`;

export type ProjectActorInput = {
  id: string;
  roleId: ProjectRoleId;
  actorType: 'USER' | 'TEAM';
  actorId: UserId;
};

export type ProjectRoleInput = {
  id: ProjectRoleId;
  projectId: ProjectId;
  actors: ProjectActorInput[];
  permissions: string[];
};

export type ProjectInput = {
  id: ProjectId;
  leadId: UserId;
  workspaceId: WorkspaceId;
  roles: ProjectRoleInput[];
  permissions: string[];
};

export type TeamInput = {
  id: string;
  workspaceId: WorkspaceId;
  leadId: UserId;
  members: TeamMemberInput[];
};

export type WorkspaceMemberInput = {
  workspaceId: WorkspaceId;
  userId: UserId;
  role: 'WS_ADMIN' | 'WS_MEMBER';
};

export type WorkspaceInput = {
  id: WorkspaceId;
  ownerId: UserId;
  members: WorkspaceMemberInput[];
};

// =========================== For Projects
export const buildProjectActorTuples = (input: ProjectActorInput): TupleKey[] => {
  const { actorType, roleId } = input;

  const tuples: TupleKey[] = [];

  const user = actorType === 'USER' ? `user:${input.actorId}` : `team:${input.actorId}#TEAM_MEMBER`;
  tuples.push({ user, relation: R.CHILD, object: asProjRole(roleId) });

  return tuples;
};

export const buildProjectRoleTuples = (input: ProjectRoleInput): TupleKey[] => {
  const tuples: TupleKey[] = [];

  // parent project
  tuples.push({ user: asProj(input.projectId), relation: R.PARENT, object: asProjRole(input.id) });

  // the role itself
  tuples.push({ user: asProjRole(input.id), relation: R.CHILD, object: asProj(input.projectId) });

  // // permissions granted to this role
  // input.permissions.forEach((perm) => {
  //   tuples.push({
  //     user: asProjRole(input.id),
  //     relation: R.GRANTS,
  //     object: asProjPerm(input.projectId, perm),
  //   });
  // });

  // actors of this role
  input.actors.flatMap(buildProjectActorTuples).forEach((t) => tuples.push(t));

  return tuples;
};

export const buildProjectTuples = (input: ProjectInput): TupleKey[] => {
  const tuples: TupleKey[] = [];

  // parent workspace
  tuples.push({ user: asWs(input.workspaceId), relation: R.PARENT, object: asProj(input.id) });

  // project lead
  tuples.push({ user: asUser(input.leadId), relation: 'PROJ_LEAD', object: asProj(input.id) });

  // // project permissions
  // input.permissions.forEach((perm) => ({
  //   user: asProj(input.id),
  //   relation: R.PARENT,
  //   object: asProjPerm(input.id, perm),
  // }));

  // project roles
  input.roles.flatMap(buildProjectRoleTuples).forEach((t) => tuples.push(t));

  return tuples;
};

// =========================== For Teams
export type TeamMemberInput = { userId: UserId; teamId: string };
export const buildTeamMemberTuples = (input: TeamMemberInput): TupleKey[] => {
  return [{ user: asUser(input.userId), relation: 'TEAM_MEMBER', object: asTeam(input.teamId) }];
};

export const buildTeamTuples = (input: TeamInput): TupleKey[] => {
  const tuples: TupleKey[] = [];

  // parent workspace
  tuples.push({
    user: asWs(input.workspaceId),
    relation: R.PARENT,
    object: asTeam(input.id),
  });

  // team lead
  tuples.push({ user: asUser(input.leadId), relation: 'TEAM_LEAD', object: asTeam(input.id) });

  // team members
  input.members.flatMap(buildTeamMemberTuples).forEach((t) => tuples.push(t));
  return tuples;
};

// =========================== For Workspaces

export const buildWorkspaceMemberTuples = (input: WorkspaceMemberInput): TupleKey[] => {
  return [{ user: asUser(input.userId), relation: input.role, object: asWs(input.workspaceId) }];
};

export const buildWorkspaceTuples = (input: WorkspaceInput): TupleKey[] => {
  const tuples: TupleKey[] = [];

  // workspace owner
  tuples.push({ user: asUser(input.ownerId), relation: 'WS_OWNER', object: asWs(input.id) });

  // workspace members
  input.members?.flatMap(buildWorkspaceMemberTuples).forEach((t) => tuples.push(t));

  return tuples;
};
