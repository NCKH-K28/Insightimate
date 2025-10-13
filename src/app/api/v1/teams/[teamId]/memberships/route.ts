import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Context = { params: Promise<{ teamId: string }> };
export const GET = async (req: NextRequest, { params }: Context) => {
  return NextResponse.json([]);
};
