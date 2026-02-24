import { TupleKey } from '@openfga/sdk';

const R = { PARENT: 'parent', CHILD: 'child', GRANTS: 'grants' } as const;

type UserId = string;
type ProjectRoleId = string;
type ProjectId = string;
type OrganizationId = string;

type UserKey = `user:${string}`;
type OrgKey = `org:${string}`;
type TeamKey = `team:${string}`;
type ProjKey = `proj:${string}`;
type ProjRoleKey = `proj_role:${string}`;
type ProjPermKey = `proj_perm:${string}:${string}`;

export const asUser = (id: UserId): UserKey => `user:${id}`;
export const asOrg = (id: OrganizationId): OrgKey => `org:${id}`;
export const asTeam = (id: string): TeamKey => `team:${id}`;
export const asProj = (id: ProjectId): ProjKey => `proj:${id}`;
export const asProjPerm = (projId: ProjectId, perm: string): ProjPermKey =>
  `proj_perm:${projId}:${perm}`;
export const asProjRole = (id: ProjectRoleId): ProjRoleKey => `proj_role:${id}`;

export type ProjActorInput = {
  id: string;
  roleId: ProjectRoleId;
  actorType: 'USER' | 'TEAM';
  actorId: UserId;
};

export type ProjRoleInput = {
  id: ProjectRoleId;
  projectId: ProjectId;
  actors: ProjActorInput[];
  permissions: string[];
};

export type ProjInput = {
  id: ProjectId;
  leadId: UserId;
  orgId: OrganizationId;
  roles: ProjRoleInput[];
  permissions: string[];
};

export type TeamInput = {
  id: string;
  orgId: OrganizationId;
  leadId: UserId;
  members: TeamMemberInput[];
};

export type OrgMemberInput = {
  orgId: OrganizationId;
  userId: UserId;
  role: 'ORG_OWNER' | 'ORG_ADMIN' | 'ORG_MEMBER';
};

export type OrganizationInput = {
  id: OrganizationId;
  ownerId: UserId;
  members: OrgMemberInput[];
};

// =========================== For Projects
export const buildProjectActorTuples = (input: ProjActorInput): TupleKey[] => {
  const { actorType, roleId } = input;

  const tuples: TupleKey[] = [];

  const user = actorType === 'USER' ? `user:${input.actorId}` : `team:${input.actorId}#TEAM_MEMBER`;
  tuples.push({ user, relation: R.CHILD, object: asProjRole(roleId) });

  return tuples;
};

export const buildProjectRoleTuples = (input: ProjRoleInput): TupleKey[] => {
  const tuples: TupleKey[] = [];

  // parent project
  tuples.push({ user: asProj(input.projectId), relation: R.PARENT, object: asProjRole(input.id) });

  // the role itself
  tuples.push({ user: asProjRole(input.id), relation: R.CHILD, object: asProj(input.projectId) });

  // permissions granted to this role
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

export const buildProjectTuples = (input: ProjInput): TupleKey[] => {
  const tuples: TupleKey[] = [];

  // parent organization
  tuples.push({ user: asOrg(input.orgId), relation: R.PARENT, object: asProj(input.id) });

  // project lead
  tuples.push({ user: asUser(input.leadId), relation: 'PROJ_LEAD', object: asProj(input.id) });

  // project permissions
  // input.permissions.forEach((perm) => {
  //   tuples.push({
  //     user: asProj(input.id),
  //     relation: R.PARENT,
  //     object: asProjPerm(input.id, perm),
  //   });
  // });

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
export const buildOrganizationMemberTuples = (input: OrgMemberInput): TupleKey[] => {
  return [{ user: asUser(input.userId), relation: input.role, object: asOrg(input.orgId) }];
};

export const buildOrganizationTuples = (input: OrganizationInput): TupleKey[] => {
  const tuples: TupleKey[] = [];

  // organization members
  input.members?.flatMap(buildOrganizationMemberTuples).forEach((t) => tuples.push(t));

  return tuples;
};
