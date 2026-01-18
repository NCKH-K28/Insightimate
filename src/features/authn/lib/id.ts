import { createId } from '@paralleldrive/cuid2';

export const genAccountId = () => `acc_${createId()}`;
export const genUserId = () => `usr_${createId()}`;
