export const runtime = 'nodejs';
import { NextResponse } from 'next/server';

export const GET = async () => {
  return NextResponse.json({ ok: true, message: 'Kafka consumer is running' }, { status: 200 });
};
