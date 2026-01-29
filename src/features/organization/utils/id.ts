import { init } from '@paralleldrive/cuid2';

export const orgCuid = init({ length: 10, fingerprint: 'organization' });
export const genOrgId = (prefix: 'org' = 'org') => `${prefix}_${orgCuid()}`;
export const genOrgInviteId = (prefix: 'oin' = 'oin') => `${prefix}_${orgCuid()}`;
