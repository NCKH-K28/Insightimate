// src/features/organization/utils/authz.ts
import { openfgaClient } from '@/features/authz-v2/clients/openfga';

export const accessibleOrgs = async (
  input: { action: 'can_view' },
  context: { actorId: string },
): Promise<string[]> => {
  const res = await openfgaClient.listObjects({
    user: `user:${context.actorId}`,
    relation: 'can_view',
    type: 'organization',
  });
  const ids = res.objects.map((obj) => obj.replace('organization:', ''));
  return ids;
};
