import { AuthorizationService, AuthzFacade } from '../types';
import { cerbosEdge } from '@/lib/authz/cerbos';
import { openfgaClient } from '@/lib/authz/openfga';

const actionToRelationMap = {
  read: 'can_view',
  'workspace:read': 'can_view',
  'project:read': 'can_view',
  'agent:read': 'can_view',
};

const rebacAllow: AuthorizationService['can'] = async (subject, action, resource, context) => {
  const relation =
    action in actionToRelationMap
      ? actionToRelationMap[action as keyof typeof actionToRelationMap]
      : action;

  const decision = await openfgaClient.check({
    relation,
    user: `${subject.type}:${subject.id}`,
    object: `${resource.type}:${resource.id}`,
  });

  const allow = decision.allowed ?? false;

  return { allow, effect: allow ? 'ALLOW' : 'DENY' };
};

const rbacAllow: AuthorizationService['can'] = async (subject, action, resource, context) => {
  const decision = await cerbosEdge.checkResource({
    principal: { id: subject.id, roles: [subject.type] },
    resource: {
      kind: resource.type,
      id: resource.id,
      attr: JSON.parse(JSON.stringify(context || {})),
    },
    actions: [action],
  });

  const res = decision.getResourceDecision(resource.type);
  const allow = res?.isAllowed(action) ?? false;

  return { allow, effect: allow ? 'ALLOW' : 'DENY' };
};

const can: AuthorizationService['can'] = async (subject, action, resource, context) => {
  const rebac = await rebacAllow(subject, action, resource, context);
  //   const
};
