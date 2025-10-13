import z from 'zod';

export function validateStartEndDate(
  { startAt, endAt }: { startAt?: string | null; endAt?: string | null },
  ctx: z.RefinementCtx,
) {
  if (!startAt && !endAt) return;

  if (startAt && endAt) {
    const start = new Date(startAt);
    const end = new Date(endAt);
    if (start >= end) {
      ctx.addIssue({
        code: 'custom',
        message: 'End date must be after start date',
        path: ['endAt'],
      });
    }
  } else {
    const pathError: string[] = [];
    if (!startAt) pathError.push('startAt');
    if (!endAt) pathError.push('endAt');
    ctx.addIssue({
      code: 'custom',
      message: `Both start date and end date are required, but got: ${pathError.join(' and ')}`,
      path: pathError,
    });
  }
}

export function validateBoardState(
  input: {
    state?: 'ACTIVE' | 'CLOSED' | 'FUTURE' | null;
    startAt?: string | null;
    endAt?: string | null;
  },
  ctx: z.RefinementCtx,
) {
  if (!input.state) return;
  if (input.state === 'FUTURE') return;
  if (!input.endAt || !input.startAt) {
    ctx.addIssue({
      code: 'custom',
      message: 'Start and end dates are required for ACTIVE or CLOSED states',
      path: ['state'],
    });
  }
}

export function validateBoardSprint(
  input: {
    state?: 'ACTIVE' | 'CLOSED' | 'FUTURE';
    startAt?: string | null;
    endAt?: string | null;
  },
  ctx: z.RefinementCtx,
) {
  validateStartEndDate(input, ctx);
  validateBoardState(input, ctx);
}
