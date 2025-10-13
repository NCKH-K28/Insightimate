// PDP: Policy Decision Point

import { ForbiddenError } from '../http/errors/auth.error';

export type Attributes = Record<string, unknown>;
export type AuthzContext = {
  action: string;
  subject: Attributes;
  resource: Attributes;
  environment?: Attributes;
};

export type Effect = 'permit' | 'deny';

export type ValidateFn<InCtx extends AuthzContext, OutCtx extends InCtx> = (ctx: InCtx) => OutCtx;

export type Policy<
  InCtx extends AuthzContext = AuthzContext,
  OutCtx extends InCtx = InCtx,
  C = Record<string, unknown>,
  O = { maskFields?: string[] },
> =
  | {
      id: string;
      effect: Effect;
      description?: string;
      validate: ValidateFn<InCtx, OutCtx>;
      target?: (ctx: OutCtx) => boolean;
      condition: (ctx: OutCtx) => boolean;
      constraints?: (ctx: OutCtx) => C | undefined;
      obligations?: O;
    }
  | {
      id: string;
      effect: Effect;
      description?: string;
      validate?: undefined;
      target?: (ctx: InCtx) => boolean;
      condition: (ctx: InCtx) => boolean;
      constraints?: (ctx: InCtx) => C | undefined;
      obligations?: O;
    };

// Quyết định
export type Decision<C = Record<string, unknown>, O = { maskFields?: string[] }> = {
  allow: boolean;
  effect: Effect;
  policyIds: string[];
  obligations?: O;
  constraints?: C;
  explanation: string[];
};

export function definePolicy<
  In extends AuthzContext,
  Out extends In,
  C = Record<string, unknown>,
  O = { maskFields?: string[] },
>(p: {
  id: string;
  effect: Effect;
  description?: string;
  validate: ValidateFn<In, Out>;
  target?: (ctx: Out) => boolean;
  condition: (ctx: Out) => boolean;
  constraints?: (ctx: Out) => C | undefined;
  obligations?: O;
}): Policy<In, Out, C, O>;

// overload: không validate -> Out = In
export function definePolicy<
  In extends AuthzContext,
  C = Record<string, unknown>,
  O = { maskFields?: string[] },
>(p: {
  id: string;
  effect: Effect;
  description?: string;
  target?: (ctx: In) => boolean;
  condition: (ctx: In) => boolean;
  constraints?: (ctx: In) => C | undefined;
  obligations?: O;
}): Policy<In, In, C, O>;

// implementation
export function definePolicy(p: any): any {
  return p;
}

// helpers

function mergeObligations(os: Array<{ maskFields?: string[] } | undefined>) {
  const mask = [...new Set(os.flatMap((o) => o?.maskFields ?? []))];
  return mask.length ? { maskFields: mask } : undefined;
}

function collectConstraints(
  cs: Array<Record<string, unknown> | undefined>,
): Record<string, unknown> | undefined {
  const cons = cs.filter((c): c is Record<string, unknown> => c !== undefined);
  if (cons.length === 0) return undefined;
  return Object.assign({}, ...cons); // gộp nông, cái sau ghi đè cái trước
}

export class PDP {
  constructor(
    private policies: Policy[],
    private algo: 'deny-overrides' | 'permit-overrides' | 'first-applicable' = 'deny-overrides',
  ) {}

  decide(ctx: AuthzContext): Decision {
    const hits: { policy: Policy; vctx: AuthzContext; matches: boolean }[] = [];
    const explain: string[] = [];

    for (const p of this.policies) {
      const vctx = p.validate ? p.validate(ctx) : ctx;

      if (p.target && !p.target(vctx)) {
        explain.push(`skip ${p.id}: target=false`);
        continue;
      }

      const cond = p.condition(vctx);
      hits.push({ policy: p, vctx, matches: cond });
      explain.push(`${p.id}: condition=${cond} -> ${p.effect}`);

      if (this.algo === 'first-applicable' && cond) {
        return {
          allow: p.effect === 'permit',
          effect: p.effect,
          policyIds: [p.id],
          obligations: p.obligations,
          constraints: p.constraints?.(vctx),
          explanation: [...explain, 'first-applicable'],
        };
      }
    }

    if (this.algo === 'deny-overrides') {
      const denyHit = hits.find((h) => h.matches && h.policy.effect === 'deny');
      if (denyHit) {
        return {
          allow: false,
          effect: 'deny',
          policyIds: [denyHit.policy.id],
          explanation: [...explain, 'deny-overrides -> deny'],
        };
      }

      const permitHits = hits.filter((h) => h.matches && h.policy.effect === 'permit');
      if (permitHits.length) {
        const obligations = mergeObligations(permitHits.map((h) => h.policy.obligations));
        const constraints = collectConstraints(
          permitHits.map((h) => h.policy.constraints?.(h.vctx)),
        );
        return {
          allow: true,
          effect: 'permit',
          policyIds: permitHits.map((h) => h.policy.id),
          obligations,
          constraints,
          explanation: [
            ...explain,
            `deny-overrides -> permit (${permitHits.length} policies merged)`,
          ],
        };
      }

      return {
        allow: false,
        effect: 'deny',
        policyIds: [],
        explanation: [...explain, 'no rule matched -> deny'],
      };
    }

    if (this.algo === 'permit-overrides') {
      const permitHits = hits.filter((h) => h.matches && h.policy.effect === 'permit');
      if (permitHits.length) {
        const obligations = mergeObligations(permitHits.map((h) => h.policy.obligations));
        const constraints = collectConstraints(
          permitHits.map((h) => h.policy.constraints?.(h.vctx)),
        );
        return {
          allow: true,
          effect: 'permit',
          policyIds: permitHits.map((h) => h.policy.id),
          obligations,
          constraints,
          explanation: [
            ...explain,
            `permit-overrides -> permit (${permitHits.length} policies merged)`,
          ],
        };
      }

      const denyHit = hits.find((h) => h.matches && h.policy.effect === 'deny');
      if (denyHit) {
        return {
          allow: false,
          effect: 'deny',
          policyIds: [denyHit.policy.id],
          explanation: [...explain, 'permit-overrides -> deny'],
        };
      }

      return {
        allow: false,
        effect: 'deny',
        policyIds: [],
        explanation: [...explain, 'no rule matched -> deny'],
      };
    }

    throw new Error(`Unknown combining algorithm: ${this.algo}`);
  }

  enforce(ctx: AuthzContext) {
    const dec = this.decide(ctx);
    if (!dec.allow) throw new ForbiddenError(`Access denied: ${dec.explanation.join('; ')}`);
  }

  getPermissions(
    ctx: Omit<AuthzContext, 'action'> & { actions: AuthzContext['action'][] },
  ): Record<string, { allow: boolean; constraints?: Record<string, unknown> }> {
    const res: Record<string, { allow: boolean; constraints?: Record<string, unknown> }> = {};
    for (const a of ctx.actions) {
      const dec = this.decide({ ...ctx, action: a });
      res[a] = dec.allow ? { allow: true, constraints: dec.constraints } : { allow: false };
    }
    return res;
  }
}
