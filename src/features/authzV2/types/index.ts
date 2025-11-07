/*
 * Authorization Service Abstraction (RBAC + ABAC + ReBAC mix)
 * Language: TypeScript (interfaces only)
 * Scope: service contracts, data types, and error model — no implementation.
 */

// ---------- Core Primitives ----------

// export type TenantId = string & { __brand: 'TenantId' };
// export type SubjectId = string & { __brand: 'SubjectId' };
// export type ResourceId = string & { __brand: 'ResourceId' };
export type TenantId = string;
export type SubjectId = string;
export type ResourceId = string;

export type ISODateTime = string; // e.g. 2025-10-26T09:30:00Z

export type SubjectType = 'user' | 'service' | 'system';
export type ResourceType = 'workspace' | 'project' | 'team' | 'agent';

export interface SubjectRef {
  id: SubjectId;
  type: SubjectType;
  attr?: Record<string, unknown>;
}

export interface ResourceRef {
  id: ResourceId;
  type: ResourceType;
  attr?: Record<string, unknown>;
}

export type Action = string; // e.g. 'view', 'edit', 'delete', 'share'

export type Context = Record<string, unknown> & {
  // Common, optional hints for ABAC/policy engines
  ip?: string;
  userAgent?: string;
  time?: ISODateTime;
  timeHour?: number; // 0..23 — convenient for time-based guards
  location?: { country?: string; region?: string; city?: string };
  requestId?: string;
};

// ---------- Authorization Decision & Explanation ----------

export type DecisionEffect = 'ALLOW' | 'DENY';

export interface Decision {
  effect: DecisionEffect;
  allow: boolean; // convenience: effect === 'ALLOW'
  reason?: ReasonCode;
  obligations?: Obligations; // masking/redaction or audit obligations
  proof?: ProofGraph; // explain/debug
}

export type ReasonCode =
  | 'ok'
  | 'no_base_allow' // neither RBAC nor ReBAC nor capabilities produced allow
  | 'explicit_deny' // an explicit deny matched
  | 'abac_guard' // ABAC policy failed
  | 'invalid_input'
  | 'error';

export interface ProofGraph {
  // Minimal, implementation-agnostic structure to visualize decisions
  nodes: Array<{
    id: string;
    kind: 'RBAC' | 'ReBAC' | 'ABAC' | 'CAPABILITY' | 'DENY' | 'MERGE';
    label?: string; // e.g. role name, policy id, tuple id
    matched?: boolean;
    details?: Record<string, unknown>;
  }>;
  edges: Array<{ from: string; to: string; label?: string }>;
}

// ---------- Fine-grained Obligations (masking, constraints) ----------

export interface Obligations {
  // Field-level masking instructions keyed by resource type
  fieldMasks?: Record<
    string,
    Array<{
      field: string;
      mode: 'HIDE' | 'REDACT' | 'HASH' | 'TRUNCATE';
      args?: Record<string, unknown>;
    }>
  >;
  // Optional: enforce row-level constraint on downstream queries
  queryConstraint?: QueryConstraint;
  // Optional: require audit tagging/logging upstream
  auditTags?: Record<string, string | number | boolean>;
}

export interface QueryConstraint {
  // Abstract predicate tree the data layer can translate into SQL/DSL
  // Example: { op: 'OR', children: [ {op:'EQ', field:'visibility', value:'public'}, {op:'EQ', field:'dept', value:'sales'} ] }
  op: 'AND' | 'OR' | 'NOT' | 'EQ' | 'NE' | 'IN' | 'GT' | 'GE' | 'LT' | 'LE' | 'LIKE' | 'EXISTS';
  field?: string;
  value?: unknown;
  values?: unknown[];
  children?: QueryConstraint[];
}

// ---------- RBAC Model ----------

export interface Permission {
  resourceType: string; // e.g. 'doc'
  action: Action; // e.g. 'view'
  condition?: string; // optional label to an ABAC policy guard to apply
}

export interface Role {
  name: string; // unique in tenant or globally
  description?: string;
  permissions: Permission[];
  metadata?: Record<string, unknown>;
}

export interface Scope {
  tenant: TenantId;
  project?: string; // optional subdivision
  resource?: ResourceRef; // bind at resource granularity (fine-grained RBAC)
}

export interface RoleBinding {
  id: string;
  subject: SubjectRef;
  role: string; // role name
  scope: Scope;
  expiresAt?: ISODateTime;
  attributes?: Record<string, unknown>; // supplemental ABAC attributes for the grant
}

// ---------- ReBAC Model (Zanzibar-style tuples) ----------

export type SubjectSet = {
  // Represents a dynamic set like group#member or resource#relation
  type: 'subject_set';
  resource: ResourceRef;
  relation: string; // e.g. 'viewer', 'editor'
};

export interface RelationshipTuple {
  id?: string; // server-assigned
  resource: ResourceRef;
  relation: string; // e.g. 'owner' | 'viewer' | 'editor' | 'parent'
  subject: SubjectRef | SubjectSet;
  createdAt?: ISODateTime;
}

export interface RelationshipReadFilter {
  resourceType?: string;
  resourceId?: ResourceId;
  relation?: string;
  subjectId?: SubjectId;
  subjectType?: SubjectType;
}

export interface ExpansionResult {
  // Transitive expansion graph for a given (resource, relation)
  proof: ProofGraph;
  subjects: SubjectRef[]; // resolved concrete subjects
}

// ---------- ABAC Model ----------

export interface AttributeRecord {
  target: SubjectRef | ResourceRef; // who/what the attributes belong to
  attrs: Record<string, unknown>;
  updatedAt?: ISODateTime;
}

export interface AttributeSchema {
  objectType: 'subject' | 'resource';
  type: string; // e.g. 'user', 'doc'
  schema: Record<
    string,
    { type: 'string' | 'number' | 'boolean' | 'array' | 'object'; required?: boolean }
  >;
}

export type PolicyEngine = 'rego' | 'casbin' | 'cedar' | 'expr' | 'custom';

export interface Policy {
  id: string;
  engine: PolicyEngine;
  version?: string;
  description?: string;
  // raw policy text (Rego/Cedar/Casbin etc.)
  body: string;
  // optional: policy is attached to a resource type or action
  attaches?: { resourceType?: string; action?: Action };
  tenant?: TenantId; // scoping
  createdAt?: ISODateTime;
  updatedAt?: ISODateTime;
}

export interface PolicyValidationResult {
  ok: boolean;
  errors?: Array<{ path?: string; message: string }>;
  warnings?: Array<{ path?: string; message: string }>;
}

export interface DryRunCase {
  name: string;
  subject: SubjectRef;
  action: Action;
  resource: ResourceRef;
  context?: Context;
  expected?: DecisionEffect;
}

export interface DryRunOutcome {
  case: DryRunCase;
  decision: Decision;
}

// ---------- Discovery & Audit ----------

export interface WhoCanResult {
  resource: ResourceRef;
  action: Action;
  subjects: SubjectRef[]; // resolved subjects who would be allowed
}

export interface WhatCanResult {
  subject: SubjectRef;
  roles: string[];
  permissions: Permission[]; // normalized permissions
  grants: Array<{ source: 'RBAC' | 'ReBAC' | 'CAPABILITY'; detail: Record<string, unknown> }>;
}

export interface DecisionLogEntry {
  id: string;
  at: ISODateTime;
  subject: SubjectRef;
  action: Action;
  resource: ResourceRef;
  context?: Context;
  effect: DecisionEffect;
  reason?: ReasonCode;
  traceId?: string;
}

export interface ChangeLogEntry {
  id: string;
  at: ISODateTime;
  who: SubjectRef;
  what: 'ROLE_BINDING' | 'RELATIONSHIP' | 'POLICY' | 'ATTRIBUTE' | 'MODEL' | 'CAPABILITY';
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export interface StatsSnapshot {
  at: ISODateTime;
  counters: Record<string, number>;
  latenciesMsP50P95P99?: { p50: number; p95: number; p99: number };
}

// ---------- Pagination & Common Results ----------

export interface Page<T> {
  items: T[];
  nextPageToken?: string;
}

export interface ListOptions {
  pageSize?: number; // default server-side
  pageToken?: string;
}

// ---------- Error Model ----------

export class AuthzError extends Error {
  constructor(
    message: string,
    public code:
      | 'INVALID_ARGUMENT'
      | 'NOT_FOUND'
      | 'ALREADY_EXISTS'
      | 'CONFLICT'
      | 'UNAUTHENTICATED'
      | 'PERMISSION_DENIED'
      | 'FAILED_PRECONDITION'
      | 'INTERNAL',
    public details?: unknown,
  ) {
    super(message);
  }
}

// ---------- Data-plane Service (Decision API) ----------

export interface AuthorizationService {
  /**
   * Primary authorization check.
   */
  can(
    subject: SubjectRef,
    action: Action,
    resource: ResourceRef,
    context?: Context,
  ): Promise<Decision>;

  /**
   * Batch authorization checks — must preserve request order.
   */
  batchCan(
    requests: Array<{
      subject: SubjectRef;
      action: Action;
      resource: ResourceRef;
      context?: Context;
    }>,
  ): Promise<Decision[]>;

  /**
   * Enumerate actions a subject may perform on a resource (after ABAC guards).
   */
  listAllowedActions(
    subject: SubjectRef,
    resource: ResourceRef,
    context?: Context,
  ): Promise<Action[]>;

  /**
   * Return IDs of resources accessible for a given action, optionally narrowed by type.
   */
  listAccessibleResources(
    subject: SubjectRef,
    action: Action,
    opts?: { resourceType?: string; filterConstraint?: QueryConstraint } & ListOptions,
  ): Promise<Page<ResourceId>>;

  /**
   * Produce a filter/constraint plan usable to guard downstream queries.
   */
  filterResources(
    subject: SubjectRef,
    action: Action,
    resourceType: string,
    context?: Context,
  ): Promise<QueryConstraint>;

  /**
   * Human/machine-readable explanation of a decision (proof graph).
   */
  explain(
    subject: SubjectRef,
    action: Action,
    resource: ResourceRef,
    context?: Context,
  ): Promise<ProofGraph>;
}

// ---------- Control-plane: RBAC ----------

export interface RoleAdminService {
  createRole(role: Role): Promise<Role>;
  updateRole(name: string, patch: Partial<Role>): Promise<Role>;
  deleteRole(name: string): Promise<void>;
  getRole(name: string): Promise<Role>;
  listRoles(opts?: ListOptions): Promise<Page<Role>>;

  attachPermissionToRole(roleName: string, perm: Permission): Promise<void>;
  detachPermissionFromRole(roleName: string, perm: Permission): Promise<void>;

  grantRole(binding: Omit<RoleBinding, 'id'>): Promise<RoleBinding>;
  revokeRole(bindingId: string): Promise<void>;
  listSubjectRoles(
    subject: SubjectRef,
    scope?: Partial<Scope> & ListOptions,
  ): Promise<Page<RoleBinding>>;
  listRoleAssignments(
    roleName: string,
    scope?: Partial<Scope> & ListOptions,
  ): Promise<Page<RoleBinding>>;
}

// ---------- Control-plane: ReBAC ----------

export interface RelationshipService {
  writes(tuples: RelationshipTuple[]): Promise<Array<RelationshipTuple>>;
  deletes(tuples: RelationshipTuple[]): Promise<void>;
  transaction({
    writes,
    deletes,
  }: {
    writes?: RelationshipTuple[];
    deletes?: RelationshipTuple[];
  }): Promise<void>;
  writeRelationship(tuple: RelationshipTuple): Promise<RelationshipTuple>; // upsert by logical key
  deleteRelationship(idOrKey: {
    id?: string;
    resource: ResourceRef;
    relation: string;
    subject: SubjectRef | SubjectSet;
  }): Promise<void>;
  readRelationships(
    filter?: RelationshipReadFilter & ListOptions,
  ): Promise<Page<RelationshipTuple>>;
  expand(resource: ResourceRef, relation: string): Promise<ExpansionResult>; // transitive closure/proof
}

// ---------- Control-plane: ABAC Attributes ----------

export interface AttributeService {
  upsertAttributes(record: AttributeRecord): Promise<AttributeRecord>;
  removeAttributes(target: SubjectRef | ResourceRef, keys?: string[]): Promise<void>; // if keys omitted => remove all
  getAttributes(target: SubjectRef | ResourceRef): Promise<AttributeRecord | undefined>;
  defineAttributeSchema(spec: AttributeSchema): Promise<void>;
}

// ---------- Control-plane: Policies (ABAC/PBAC) ----------

export interface PolicyService {
  createPolicy(policy: Policy): Promise<Policy>;
  updatePolicy(id: string, patch: Partial<Policy>): Promise<Policy>;
  deletePolicy(id: string): Promise<void>;
  getPolicy(id: string): Promise<Policy>;
  listPolicies(
    filter?: { tenant?: TenantId; resourceType?: string; action?: Action } & ListOptions,
  ): Promise<Page<Policy>>;

  validatePolicy(policy: Policy): Promise<PolicyValidationResult>;
  dryRunPolicy(policy: Policy, cases: DryRunCase[]): Promise<DryRunOutcome[]>;
}

// ---------- Discovery ----------

export interface DiscoveryService {
  whoCan(resource: ResourceRef, action: Action, opts?: ListOptions): Promise<Page<SubjectRef>>;
  whatCan(subject: SubjectRef, scope?: Partial<Scope>): Promise<WhatCanResult>;
  listPrincipalsWithRole(
    roleName: string,
    scope?: Partial<Scope> & ListOptions,
  ): Promise<Page<SubjectRef>>;
  listDirectGrants(
    target: SubjectRef | ResourceRef,
    opts?: ListOptions,
  ): Promise<Page<Record<string, unknown>>>; // engine-specific
}

// ---------- Observability & Operations ----------

export interface ObservabilityService {
  getDecisionLog(
    filter?: {
      subjectId?: SubjectId;
      resourceId?: ResourceId;
      action?: Action;
      from?: ISODateTime;
      to?: ISODateTime;
    } & ListOptions,
  ): Promise<Page<DecisionLogEntry>>;

  getChangeLog(
    filter?: {
      whoId?: SubjectId;
      what?: ChangeLogEntry['what'];
      from?: ISODateTime;
      to?: ISODateTime;
    } & ListOptions,
  ): Promise<Page<ChangeLogEntry>>;

  stats(): Promise<StatsSnapshot>;
  healthz(): Promise<{ status: 'ok' | 'degraded' | 'down'; details?: Record<string, unknown> }>;
  invalidateCache(keys?: string[]): Promise<void>; // e.g. by subject/resource/model keys

  exportState(): Promise<Blob | ArrayBuffer>; // serialized policies/tuples/roles/bindings/attrs
  importState(payload: Blob | ArrayBuffer, opts?: { mode?: 'merge' | 'replace' }): Promise<void>;
}

// ---------- Aggregated Facade ----------

export interface AuthzFacade extends AuthorizationService {
  rbac: RoleAdminService;
  rebac: RelationshipService;
  abac: AttributeService;
  policy: PolicyService;
  discovery: DiscoveryService;
  ops: ObservabilityService;
}

// ---------- Optional: Capability tokens (for share links, etc.) ----------

export interface CapabilityToken {
  id: string; // opaque
  resource: ResourceRef;
  actions: Action[];
  issuedTo?: SubjectRef; // or anonymous/public if omitted
  expiresAt?: ISODateTime;
  tenant?: TenantId;
}

export interface CapabilityService {
  issue(token: Omit<CapabilityToken, 'id'>): Promise<CapabilityToken>;
  revoke(id: string): Promise<void>;
  get(id: string): Promise<CapabilityToken | undefined>;
}

// ---------- Convenience Types for Implementers ----------

export interface AuthorizeRequest {
  subject: SubjectRef;
  action: Action;
  resource: ResourceRef;
  context?: Context;
}

export interface AuthorizeResponse extends Decision {}

// An implementation would wire the pipeline roughly as:
// allow = (RBAC_allow OR ReBAC_allow OR CAP_allow) AND ABAC_allow AND NOT explicit_deny

export interface PipelineHooks {
  // Hooks give adopters a way to extend the decision lifecycle
  beforeEvaluate?(req: AuthorizeRequest): Promise<void> | void;
  afterEvaluate?(req: AuthorizeRequest, res: AuthorizeResponse): Promise<void> | void;
  onCacheInvalidation?(keys: string[]): Promise<void> | void;
}

// ---------- Example minimal facade shape ----------

export function createAuthzFacade(deps: {
  authorization: AuthorizationService;
  rbac: RoleAdminService;
  rebac: RelationshipService;
  abac: AttributeService;
  policy: PolicyService;
  discovery: DiscoveryService;
  ops: ObservabilityService;
  capability?: CapabilityService;
}): AuthzFacade & { capability?: CapabilityService } {
  return {
    ...deps.authorization,
    rbac: deps.rbac,
    rebac: deps.rebac,
    abac: deps.abac,
    policy: deps.policy,
    discovery: deps.discovery,
    ops: deps.ops,
    ...(deps.capability ? { capability: deps.capability } : {}),
  } as AuthzFacade & { capability?: CapabilityService };
}
