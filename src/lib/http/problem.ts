import { z, ZodError } from 'zod';

export const ZProblem = z.object({
  type: z.string().url().optional().default('about:blank'),
  title: z.string(),
  status: z.number().int(),
  instance: z.string().optional(),
  detail: z.string().optional(),
  errors: z
    .array(
      z.object({
        path: z.array(z.union([z.string(), z.number()])),
        message: z.string(),
        code: z.string().optional(),
      }),
    )
    .optional(),
});

export type Problem = z.infer<typeof ZProblem>;

export function toProblemResponse(p: Problem) {
  return new Response(JSON.stringify(p), {
    status: p.status,
    headers: { 'content-type': 'application/problem+json; charset=utf-8' },
  });
}

export function fromZodError(err: ZodError, status = 400): Problem {
  return {
    type: 'about:blank',
    title: 'Validation Error',
    status,
    detail: 'One or more fields are invalid',
    errors: err.issues.map((i) => ({ path: i.path.map(String), message: i.message, code: i.code })),
  };
}
