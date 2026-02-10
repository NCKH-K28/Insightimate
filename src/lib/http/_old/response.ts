import { z } from 'zod';

export const ZListMeta = z.object({
  page: z.number().int(),
  perPage: z.number().int(),
  total: z.number().int(),
  hasNext: z.boolean(),
});

export type ListMeta = z.infer<typeof ZListMeta>;

export function ok<T>(data: T, init?: ResponseInit) {
  return new Response(JSON.stringify({ data }), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init?.headers ?? {}),
    },
  });
}

export function list<T>(data: T[], meta: ListMeta, init?: ResponseInit) {
  return new Response(JSON.stringify({ data, meta }), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init?.headers ?? {}),
    },
  });
}

export function created<T>(data: T, location: string) {
  return new Response(JSON.stringify({ data }), {
    status: 201,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      location: location,
    },
  });
}

export function noContent(init?: ResponseInit) {
  return new Response(null, { status: 204, ...(init ?? {}) });
}
