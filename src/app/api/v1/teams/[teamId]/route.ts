import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { teamUpdateSchema } from '../../../../../../.temp/schemas/team';
import { httpExceptionFilter } from '@/lib/http/filters';

type Context = { params: Promise<{ teamId: string }> };
export const GET = async (request: NextRequest, { params }: Context) => {
  const teamId = await params.then((p) => p.teamId);
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return NextResponse.json({ message: 'Team not found' }, { status: 404 });
  return NextResponse.json(team);
};

export const PATCH = async (request: NextRequest, { params }: Context) => {
  try {
    const { teamId } = await params;
    const body = await request.json();
    const valid = teamUpdateSchema.parse(body);
    const team = await prisma.team.update({ where: { id: teamId }, data: { ...valid } });
    return NextResponse.json(team, { status: 200 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
};
