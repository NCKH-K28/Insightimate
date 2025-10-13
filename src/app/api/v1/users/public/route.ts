import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search');
  if (!search || search.trim().length === 0) return NextResponse.json([], { status: 200 });

  const maxResults = 4;

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, email: true, avatar: true },
    take: maxResults,
  });

  const result = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
  }));

  return NextResponse.json(result);
}
