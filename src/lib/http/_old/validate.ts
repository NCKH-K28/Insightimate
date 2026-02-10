// import { ZodSchema, ZodError } from 'zod';
// import { fromZodError, toProblemResponse } from './problem';

// export async function parseJson<T>(req: Request, schema: ZodSchema<T>) {
//   try {
//     const raw = await req.json();
//     return schema.parse(raw);
//   } catch (e) {
//     if (e instanceof ZodError) return toProblemResponse(fromZodError(e, 400));
//     return toProblemResponse({ title: 'Invalid JSON', status: 400, detail: 'Malformed JSON body' });
//   }
// }

// export function parseQuery<T>(req: Request, schema: ZodSchema<T>) {
//   try {
//     const url = new URL(req.url);
//     const raw = Object.fromEntries(url.searchParams);
//     return schema.parse(raw);
//   } catch (e) {
//     if (e instanceof ZodError) return toProblemResponse(fromZodError(e, 400));
//     return toProblemResponse({ title: 'Invalid Query', status: 400 });
//   }
// }

// export function parseQueryAdvanced<T>(
//   req: Request,
//   fn: (sp: URLSearchParams) => any,
//   schema: ZodSchema<T>,
// ) {
//   try {
//     const url = new URL(req.url);
//     const raw = fn(url.searchParams);
//     return schema.parse(raw);
//   } catch (e) {
//     if (e instanceof ZodError) return toProblemResponse(fromZodError(e, 400));
//     return toProblemResponse({ title: 'Invalid Query', status: 400 });
//   }
// }

// export function getHeader(req: Request, name: string) {
//   const v = req.headers.get(name);
//   return v?.trim() || null;
// }
