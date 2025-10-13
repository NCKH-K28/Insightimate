import { inviteService } from '@/features/authz/server';
import { NextRequest } from 'next/server';

type Params = Promise<{ inviteId: string }>;
export const POST = async (request: NextRequest, { params }: { params: Params }) => {
  const { inviteId } = await params;
  const result = inviteService.revokeInvite(inviteId, { actorId: 'system' });
  return result;
};
