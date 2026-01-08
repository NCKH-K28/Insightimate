import { rebuildAuthzData } from '@/features/authz/server/authz.service';
import { NextResponse } from 'next/server';

export const GET = async () => {
  const result = await rebuildAuthzData();
  return NextResponse.json({ result });
};
 