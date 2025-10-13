// src/app/api/workspaces/[workspaceId]/members/invite/route.ts

import { httpExceptionFilter } from '@/lib/http/filters';
import { authenticated, userRolesGuard } from '@/lib/guards';
import { workspaceInviteSchema } from '../../../../../../../../.temp/schemas/workspace';
import { getUserFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createId as generateCuid } from '@paralleldrive/cuid2';

type Context = { params: Promise<{ workspaceId: string }> };
export const POST = async (req: NextRequest, ctx: Context) => {
  try {
    const params = await ctx.params;
    await authenticated(req, params);
    await userRolesGuard(req, params);

    const { workspaceId } = params;
    const user = await getUserFromRequest(req);

    const body = await req.json();
    const valid = workspaceInviteSchema.parse(body);
    // check permission to

    // add member
    // FIXME: send email to invitees
    const uniqueInvitees = Array.from(new Set(valid.invitees));
    const existingUsers = await prisma.user.findMany({
      where: { email: { in: uniqueInvitees } },
      select: { id: true, email: true },
    });
    const members = await prisma.workspaceMember.createMany({
      data: existingUsers.map((u) => ({
        id: `wmem_${generateCuid()}`,
        workspaceId,
        userId: u.id,
        role: valid.role,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json(
      { message: `Invited ${members.count} members successfully.` },
      { status: 200 },
    );
  } catch (error) {
    return httpExceptionFilter(error, req);
  }
};
