// src/contracts/auth/auth.ts
import { z } from 'zod';

export const ZAuthContext = z.object({
  user: z.object({ id: z.string(), email: z.email() }),
});
export const ZAuthClaims = z.object({
  sub: z.string().min(1, 'sub is required'),
  email: z.email().optional(),
  // JWT standard:
  iat: z.number().optional(),
  exp: z.number().optional(),
  iss: z.string().optional(),
  aud: z.union([z.string(), z.array(z.string())]).optional(),
});
export type AuthClaims = z.infer<typeof ZAuthClaims>;
export type AuthContext = z.infer<typeof ZAuthContext>;
