import { openfgaClient } from '@/lib/auth/authz/openfga';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const GET = async () => {
  try {
    await openfgaClient.deleteStore({ storeId: '01K69SWJN3059HG0QG0D8HFMZ5' });
    // Get audit logs from ActivityLog table
    const logs = await prisma.activityLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
};
