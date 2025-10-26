/*
 * Usage examples for the Authorization Service Abstraction
 * Assumes you already have an instance `authz: AuthzFacade` from the abstraction file.
 */

// -----------------------------------------------------------------------------
// 0) Common helpers to map app users/requests -> SubjectRef/ResourceRef/Context
// -----------------------------------------------------------------------------

import { Handler, HandleRequest, Middleware } from '@/lib/http/api-compose';
import type {
  Action,
  AuthzFacade,
  AuthorizationService,
  ResourceRef,
  SubjectRef,
  QueryConstraint,
  CapabilityService,
  Decision,
  Obligations,
} from './types';
import { NextResponse } from 'next/server';
import get from 'lodash/get';
import set from 'lodash/set';
import merge from 'lodash/merge';

export function subjectFromReq(req: HandleRequest): SubjectRef {
  const user = get(req, 'auth.user', {}) as any;
  return { id: user.id, type: 'user', tenant: user.tenant } as SubjectRef;
}

export function resourceFromParams(type: string, req: HandleRequest | { id: string }): ResourceRef {
  const user = get(req, 'auth.user', {}) as any;

  let id: ResourceRef['id'] | null = null;
  if ('params' in req) {
    const params = Object.keys(req.params);
    id = params[params.length - 1] as ResourceRef['id'];
  } else if ('id' in req) {
    id = req.id as ResourceRef['id'];
  }

  if (!id) throw new Error('Resource ID not found in request params');

  return { id, type, tenant: user?.tenant };
}

export function contextFromReq(req: any) {
  return {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    time: new Date().toISOString(),
    timeHour: new Date().getHours(),
    tenant: req.user?.tenant,
    requestId: req.id,
  };
}

export function authorize(
  action: Action,
  resourceType: string,
  mapResource: (req: any) => ResourceRef = (req) => resourceFromParams(resourceType, req),
  mapSubject: (req: any) => SubjectRef = (req) => subjectFromReq(req),
): Middleware {
  return async (req, res) => {
    try {
      const subject = mapSubject(req);
      const resource = mapResource(req);
      const ctx = contextFromReq(req);
      const decision = await authz.can(subject, action, resource, ctx);
      if (!decision.allow) {
        return NextResponse.json({ error: 'FORBIDDEN', reason: decision.reason }, { status: 403 });
      }

      merge(req, { authz: { decision } });
    } catch (e) {
      console.error('Authorization error:', e);
      return NextResponse.json({ error: 'ERROR', message: (e as Error).message }, { status: 500 });
    }
  };
}

// Usage:
// app.get('/v1/docs/:id', authorize(authz, 'view', 'doc'), getDocHandler);

// -----------------------------------------------------------------------------
// 2) Apply field masks from obligations after a successful decision
// -----------------------------------------------------------------------------

export function applyFieldMasks<T extends Record<string, any>>(
  resourceType: string,
  data: T,
  obligations?: Obligations,
): T {
  if (!obligations?.fieldMasks) return data;
  const masks = obligations.fieldMasks[resourceType] || [];
  const clone = { ...data };
  for (const m of masks) {
    if (!(m.field in clone)) continue;
    switch (m.mode) {
      case 'HIDE':
        delete clone[m.field];
        break;
      case 'REDACT':
        // clone[m.field] = '••••';
        set(clone, m.field, '••••');
        break;
      case 'HASH':
        // clone[m.field] = `sha256(${String(clone[m.field]).length}B)`; // example; hash for real in prod
        set(clone, m.field, `sha256(${String(clone[m.field]).length}B)`);
        break;
      case 'TRUNCATE':
        const n = Number(m.args?.n ?? 4);
        // clone[m.field] = String(clone[m.field]).slice(0, n) + '…';
        set(clone, m.field, String(clone[m.field]).slice(0, n) + '…');
        break;
    }
  }
  return clone;
}

// In a handler after authorize():
// const doc = await repo.getDoc(req.params.id);
// const masked = applyFieldMasks('doc', doc, (req as any).authz.decision.obligations);
// res.json(masked);

// -----------------------------------------------------------------------------
// 3) Data-access guard — build a SQL WHERE from `filterResources()`
// -----------------------------------------------------------------------------

export async function buildGuardedWhereClause(
  authz: AuthorizationService,
  subject: SubjectRef,
  action: Action,
  resourceType: string,
  context?: Record<string, unknown>,
): Promise<{ sql: string; params: any[] }> {
  const constraint = await authz.filterResources(subject, action, resourceType, context);
  return compileConstraintToSQL(constraint);
}

// Minimal compiler from QueryConstraint -> SQL (positional params)
export function compileConstraintToSQL(node: QueryConstraint): { sql: string; params: any[] } {
  switch (node.op) {
    case 'EQ':
      return { sql: `${node.field} = ?`, params: [node.value] };
    case 'NE':
      return { sql: `${node.field} <> ?`, params: [node.value] };
    case 'IN':
      if (!node.values || node.values.length === 0) return { sql: '1=0', params: [] };
      return {
        sql: `${node.field} IN (${node.values.map(() => '?').join(',')})`,
        params: node.values,
      };
    case 'LIKE':
      return { sql: `${node.field} LIKE ?`, params: [node.value] };
    case 'GT':
      return { sql: `${node.field} > ?`, params: [node.value] };
    case 'GE':
      return { sql: `${node.field} >= ?`, params: [node.value] };
    case 'LT':
      return { sql: `${node.field} < ?`, params: [node.value] };
    case 'LE':
      return { sql: `${node.field} <= ?`, params: [node.value] };
    case 'EXISTS':
      // Suppose field is a subquery string; decide per engine
      return { sql: `EXISTS (${node.value})`, params: [] };
    case 'NOT': {
      const inner = compileConstraintToSQL((node.children || [])[0]);
      return { sql: `(NOT (${inner.sql}))`, params: inner.params };
    }
    case 'AND':
    case 'OR': {
      const parts = (node.children || []).map(compileConstraintToSQL);
      if (parts.length === 0) return { sql: node.op === 'AND' ? '1=1' : '1=0', params: [] };
      const sql = parts.map((p) => `(${p.sql})`).join(` ${node.op} `);
      const params = parts.flatMap((p) => p.params);
      return { sql, params };
    }
    default:
      return { sql: '1=0', params: [] };
  }
}

// Usage in repo:
// const { sql, params } = await buildGuardedWhereClause(authz, subject, 'view', 'doc', ctx);
// const rows = await db.query(`SELECT * FROM docs WHERE ${sql} ORDER BY created_at DESC LIMIT 50`, params);

// -----------------------------------------------------------------------------
// 4) Batch checks to avoid N+1 in GraphQL/REST lists
// -----------------------------------------------------------------------------

// export async function filterDocsByAuth(
//   authz: AuthorizationService,
//   subject: SubjectRef,
//   docs: Array<{ id: string; type: 'doc'; tenant?: string }>,
//   ctx: any,
// ) {
//   const decisions = await authz.batchCan(
//     docs.map((d) => ({
//       subject,
//       action: 'view' as Action,
//       resource: { id: d.id, type: 'doc', tenant: d.tenant },
//       context: ctx,
//     })),
//   );
//   return docs.filter((_, i) => decisions[i].allow);
// }

// -----------------------------------------------------------------------------
// 5) Admin flows — mix RBAC/ReBAC/ABAC control-plane
// -----------------------------------------------------------------------------

// export async function grantProjectEditorRole(
//   authz: AuthzFacade,
//   userId: string,
//   tenant: string,
//   project: string,
// ) {
//   await authz.rbac.grantRole({
//     subject: { id: userId as any, type: 'user', tenant },
//     role: 'project-editor',
//     scope: { tenant: tenant as any, project },
//   });
// }

// export async function addDocEditorRelation(
//   authz: AuthzFacade,
//   docId: string,
//   groupId: string,
//   tenant: string,
// ) {
//   await authz.rebac.writeRelationship({
//     resource: { id: docId as any, type: 'doc', tenant: tenant as any },
//     relation: 'editor',
//     subject: { id: groupId as any, type: 'group', tenant: tenant as any },
//   });
// }

// export async function setUserDeptAttribute(
//   authz: AuthzFacade,
//   userId: string,
//   tenant: string,
//   dept: string,
// ) {
//   await authz.abac.upsertAttributes({
//     target: { id: userId as any, type: 'user', tenant: tenant as any },
//     attrs: { dept },
//   });
// }

// -----------------------------------------------------------------------------
// 6) Capability links (optional)
// -----------------------------------------------------------------------------

export async function createShareLink(cap: CapabilityService, docId: string, tenant: string) {
  const token = await cap.issue({
    resource: { id: docId as any, type: 'doc', tenant: tenant as any },
    actions: ['view'],
    expiresAt: new Date(Date.now() + 7 * 24 * 3600_000).toISOString(),
  });
  return `https://app.example.com/share/${token.id}`;
}

// -----------------------------------------------------------------------------
// 7) Explain/Debug a denial
// -----------------------------------------------------------------------------

export async function debugDecision(
  authz: AuthorizationService,
  subject: SubjectRef,
  resource: ResourceRef,
  action: Action,
) {
  const decision = await authz.can(subject, action, resource);
  if (decision.allow) return { ok: true, reason: 'allowed' };
  const proof = await authz.explain(subject, action, resource);
  return { ok: false, reason: decision.reason, proof };
}

// -----------------------------------------------------------------------------
// 8) Policy CI: validate & dry-run ABAC policies before rollout
// -----------------------------------------------------------------------------

export async function validateAndDryRunPolicy(authz: AuthzFacade) {
  const policy = {
    id: 'doc-business-hours',
    engine: 'rego',
    body: `package authz.abac

default allow = false

allow { input.context.timeHour >= 8; input.context.timeHour < 19 }`,
    attaches: { resourceType: 'doc', action: 'view' as Action },
  } as any;

  const result = await authz.policy.validatePolicy(policy);
  if (!result.ok) throw new Error('Policy invalid: ' + JSON.stringify(result.errors));

  const cases = [
    {
      name: 'working-hour',
      subject: { id: 'u1' as any, type: 'user', tenant: 't1' as any },
      action: 'view' as Action,
      resource: { id: 'd1' as any, type: 'doc', tenant: 't1' as any },
      context: { timeHour: 10 },
      expected: 'ALLOW',
    },
    {
      name: 'late-night',
      subject: { id: 'u1' as any, type: 'user', tenant: 't1' as any },
      action: 'view' as Action,
      resource: { id: 'd1' as any, type: 'doc', tenant: 't1' as any },
      context: { timeHour: 22 },
      expected: 'DENY',
    },
  ];

  const outcomes = await authz.policy.dryRunPolicy(policy, cases as any);
  return outcomes.map((o) => ({ name: o.case.name, effect: o.decision.effect }));
}

// -----------------------------------------------------------------------------
// 9) GraphQL resolver snippet (Apollo style)
// -----------------------------------------------------------------------------

/*
const resolvers = {
  Query: {
    doc: async (_: any, { id }: { id: string }, { authz, user, dataSources }: any) => {
      const subject = { id: user.id, type: 'user', tenant: user.tenant };
      const resource = { id, type: 'doc', tenant: user.tenant };
      const decision = await authz.can(subject, 'view', resource);
      if (!decision.allow) throw new ForbiddenError(decision.reason || 'FORBIDDEN');
      const doc = await dataSources.docRepo.getById(id);
      return applyFieldMasks('doc', doc, decision.obligations);
    },
  },
};
*/

// -----------------------------------------------------------------------------
// 10) Admin/reporting — whoCan & listAccessibleResources
// -----------------------------------------------------------------------------

export async function reportWhoCanView(authz: AuthzFacade, docId: string, tenant: string) {
  const page = await authz.discovery.whoCan(
    { id: docId as any, type: 'doc', tenant: tenant as any },
    'view',
  );
  return page.items.map((s) => `${s.type}:${s.id}`);
}

export async function listDocsICanSee(authz: AuthorizationService, subject: SubjectRef) {
  const page = await authz.listAccessibleResources(subject, 'view', {
    resourceType: 'doc',
    pageSize: 100,
  });
  return page.items; // array of doc IDs
}
