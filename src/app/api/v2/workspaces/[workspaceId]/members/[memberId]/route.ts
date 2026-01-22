import { authenticated } from '@/lib/authn';
import { middlewareHandler } from '@/lib/http/api-handler';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// FIXME: call service to handle business logic
type Params = { workspaceId: string; memberId: string };
export const DELETE = middlewareHandler<Params>([authenticated], async (req, { params }) => {
  const { workspaceId, memberId } = params;

  const member = await prisma.workspaceMember.delete({
    where: { id: memberId, workspaceId: workspaceId },
  });
  if (!member) throw new Error('Member not found');
  return NextResponse.json(member, { status: 200 });
});
