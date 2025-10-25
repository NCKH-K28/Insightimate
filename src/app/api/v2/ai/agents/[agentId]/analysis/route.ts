import { authenticatedV2 } from '@/lib/auth';
import { compose } from '@/lib/http/api-compose';
import { inngest } from '@/lib/inngest';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';

const ZParams = z.object({ agentId: z.string().min(1) });

export const GET = async () => {
  const analysis = await prisma.aIAnalysis.findMany();
  const result = { data: analysis };

  return NextResponse.json(result);
};

const ZAnalysisCreateInput = z.object({ id: z.string().min(1) });

export const POST = compose(authenticatedV2, async (req, res) => {
  const params = ZParams.parse(req.params);
  const body = await req.json();
  const input = ZAnalysisCreateInput.parse(body);

  const s = await prisma.agentSource.findUnique({ where: { id: input.id } });
  if (!s) return NextResponse.json({ error: 'Source not found' }, { status: 404 });

  // Create a new analysis record
  const newAnalysis = await prisma.aIAnalysis.create({
    data: {
      id: `analysis_${Math.random().toString(36).substring(2, 15)}`,
      aSourceId: input.id,
      agentId: params.agentId,
      status: 'PENDING',
    },
  });

  await inngest.send({
    name: 'agents/analysis.created',
    data: { analysisId: newAnalysis.id, sourceId: input.id, agentId: params.agentId },
  });

  return NextResponse.json(newAnalysis);
});
