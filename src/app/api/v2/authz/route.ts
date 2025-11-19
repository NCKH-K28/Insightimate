import { rebuildAuthzData } from '@/features/authz/server/authz.service';
import { NextResponse } from 'next/server';

export const GET = async (request: Request) => {
  const result = await rebuildAuthzData();
  return NextResponse.json({ result });
};
 