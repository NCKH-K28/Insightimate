import get from 'lodash/get';
import { NextRequest } from 'next/server';
import { AuthContext, ZAuthContext } from '@/contracts/auth';

export const getAuthFromRequest = async (
  request: NextRequest,
  parse: boolean = true,
): Promise<AuthContext> => {
  const auth = get(request, 'auth', null);
  if (!auth) throw new Error('Missing "auth" in "request"');
  if (!parse) return auth;
  const valid = ZAuthContext.safeParse(auth);
  if (!valid.success)
    throw new Error('Invalid "auth" in "request"' + JSON.stringify(valid.error.issues));
  return valid.data;
};

export const getAuthFromRequestHono = async (c: any, parse: boolean = true) => {
  const auth = c.get('jwtPayload');
  if (!auth) throw new Error('Missing "auth" in "request"');
  return { id: auth.sub, email: auth.email, userId: auth.sub };
};
