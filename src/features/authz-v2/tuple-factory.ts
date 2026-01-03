import { TupleKey } from '@openfga/sdk';

const R = { PARENT: 'parent', CHILD: 'child', GRANTS: 'grants' } as const;

type UserId = string;
type ProjectRoleId = string;
type ProjectId = string;
type OrganizationId = string;

const asUser = (id: UserId) => `user:${id}`;
const asOrg = (id: OrganizationId) => `organization:${id}`;
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
  orgId: OrganizationId;
  roles: ProjectRoleInput[];
  permissions: string[];
};

export type TeamInput = {
  id: string;
  orgId: OrganizationId;
  leadId: UserId;
  members: TeamMemberInput[];
};

export type WorkspaceMemberInput = {
  orgId: OrganizationId;
  userId: UserId;
  role: 'ORG_OWNER' | 'ORG_ADMIN' | 'ORG_MEMBER';
};

export type OrganizationInput = {
  id: OrganizationId;
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

  // parent organization
  tuples.push({ user: asOrg(input.orgId), relation: R.PARENT, object: asProj(input.id) });

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

  // parent organization
  tuples.push({ user: asOrg(input.orgId), relation: R.PARENT, object: asTeam(input.id) });

  // team lead
  tuples.push({ user: asUser(input.leadId), relation: 'TEAM_LEAD', object: asTeam(input.id) });

  // team members
  input.members.flatMap(buildTeamMemberTuples).forEach((t) => tuples.push(t));
  return tuples;
};

// =========================== For Organizations
export const buildOrganizationMemberTuples = (input: WorkspaceMemberInput): TupleKey[] => {
  return [{ user: asUser(input.userId), relation: input.role, object: asOrg(input.orgId) }];
};

export const buildOrganizationTuples = (input: OrganizationInput): TupleKey[] => {
  const tuples: TupleKey[] = [];

  // organization members
  input.members?.flatMap(buildOrganizationMemberTuples).forEach((t) => tuples.push(t));

  return tuples;
};
