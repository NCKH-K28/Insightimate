import { z } from 'zod';
import { ZPassword, ZUser, ZUserCreateInput } from '../users';

export const ZSignInInput = z.object({ email: ZUser.shape.email, password: ZPassword });
export const ZSignUpInput = ZUserCreateInput.extend({ password: ZPassword });
