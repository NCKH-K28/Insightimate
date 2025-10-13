import { inviteService } from '@/features/authz/server';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token') || '';
  const result = await inviteService.getInviteInfo(token);
  return NextResponse.json(result);
};

export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const result = await inviteService.processInvite(body);
  return NextResponse.json(result);
};
