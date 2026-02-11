import { buildApi } from '@/lib/api/_buildapi';
import z from 'zod';

// ========== URL FACTORY ==========
const AUTH_BASE = 'v3/auth' as const;
const ME_BASE = 'v3' as const;

export const authApi = buildApi({
  signUp: { path: `${AUTH_BASE}/signup` as const, method: 'post', schemas: { body: z.any() } },
  signIn: { path: `${AUTH_BASE}/signin` as const, method: 'post', schemas: { body: z.any() } },
  signOut: { path: `${AUTH_BASE}/signout` as const, method: 'post' },
  getMe: { path: `${ME_BASE}/me` as const, method: 'get', schemas: { response: z.any() } },
});
