import { openfgaClient } from '@/lib/authz/openfga';

export const listAccessibleResources = async (input: {
  action: 'can_view';
  subject: { type: 'user'; id: string };
  resource: { type: 'project' | 'workspace' };
}) => {
  const res = await openfgaClient.listObjects({
    user: `${input.subject.type}:${input.subject.id}`,
    relation: input.action,
    type: input.resource.type,
  });

  const ids = res.objects.map((obj) => obj.replace(`${input.resource.type}:`, ''));
  return ids;
};
