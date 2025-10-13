// src/app/api/v2/workspaces/[workspaceId]/members/assign_role/route.ts

import { middlewareHandler } from '@/lib/http/api-handler';
import { authenticated } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// FIXME: missing permission check, missing validation
// FIXME: missing add to openfga
export const PATCH = middlewareHandler<{
  workspaceId: string;
  memberId: string;
}>([authenticated], async (req, { params }) => {
  const body = await req.json();
  const role: 'WS_ADMIN' | 'WS_MEMBER' = body.role;
  if (!role) return NextResponse.json({ message: 'Role is required' }, { status: 400 });
  if (role !== 'WS_ADMIN' && role !== 'WS_MEMBER')
    return NextResponse.json({ message: 'Invalid role' }, { status: 400 });

  const member = await prisma.workspaceMember.update({
    where: { id: params.memberId, workspaceId: params.workspaceId },
    data: { role },
  });

  return NextResponse.json({ message: 'Role assigned', member }, { status: 200 });
});

export const DELETE = middlewareHandler<{
  workspaceId: string;
  memberId: string;
}>([authenticated], async (req) => {
  const params = req.params;
  const member = await prisma.workspaceMember.delete({
    where: { id: params.memberId, workspaceId: params.workspaceId },
  });

  return NextResponse.json({ message: 'Member removed', member }, { status: 200 });
});
