import { Hono } from 'hono';

type Variables = { jwtPayload: { sub: string; email: string; iat: number; exp: number } };
export const app = new Hono<{ Variables: Variables }>();

export const appAPIV3 = new Hono().basePath('/api/v3' as const);
