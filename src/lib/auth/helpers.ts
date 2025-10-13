import get from 'lodash/get';
import { NextRequest } from 'next/server';
import { AuthContext, ZAuthContext } from '@/contracts/auth';

export const getAuthFromRequest = async (request: NextRequest): Promise<AuthContext> => {
  const auth = get(request, 'auth', null);
  if (!auth) throw new Error('Missing "auth" in "request"');
  const valid = ZAuthContext.safeParse(auth);
  if (!valid.success)
    throw new Error('Invalid "auth" in "request"' + JSON.stringify(valid.error.issues));
  return valid.data;
};
