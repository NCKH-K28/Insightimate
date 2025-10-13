'use server';

import { loadAttributes } from '@/lib/authz';
import { httpExceptionFilter } from '@/lib/http/filters';
import { authenticated } from '@/lib/guards';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { workspaceMemberUpdateSchema } from '../../../../../../../../.temp/schemas/workspace';

type Context = { params: Promise<{ workspaceId: string; memberId: string }> };
export async function PUT(request: NextRequest, ctx: Context) {
  try {
    const params = await ctx.params;
    await authenticated(request, params);
    await loadAttributes(request, params);

    const member = await prisma.workspaceMember.findUnique({ where: { id: params.memberId } });
    if (!member) return new Response('Member not found', { status: 404 });

    const body = await request.json();
    const valid = workspaceMemberUpdateSchema.parse(body);

    const updated = await prisma.workspaceMember.update({
      where: { id: params.memberId },
      data: { role: valid.role },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
}
