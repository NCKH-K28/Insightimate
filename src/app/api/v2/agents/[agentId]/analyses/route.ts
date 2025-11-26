import { AnalysisCreateInput, ZAnalysisCreateInput } from '@/contracts/agents/agents.input';
import { authenticatedV2 } from '@/lib/auth';
import { compose } from '@/lib/http/api-compose';
import { getZodBody, getZodParams, zodBodyPipe, zodParamsPipe } from '@/lib/http/zod-pipes';
import { kafka } from '@/lib/kafka';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const ZAnalysisParams = z.object({ agentId: z.string() });

export const GET = async () => {
  const analysis = await prisma.analysis.findMany();
  return NextResponse.json({ data: analysis });
};

const estimation = async (input: AnalysisCreateInput & { type: 'ESTIMATION'; agentId: string }) => {
  const producer = kafka.producer();
  await producer.connect();

  const newAnalysis = await prisma.analysis.create({
    data: {
      id: `analysis_${Math.random().toString(36).substring(2, 15)}`,
      dataSourceId: input.dataSourceId,
      agentId: input.agentId,
      runStatus: 'PENDING',
      version: 1,
      type: 'ESTIMATION',
    },
  });

  const evt = {
    analysisId: newAnalysis.id,
    dataSourceId: newAnalysis.dataSourceId,
    agentId: newAnalysis.agentId,
  };

  await producer.send({
    topic: 'agents.analysis.created',
    messages: [{ value: JSON.stringify(evt) }],
  });

  await producer.disconnect();

  return newAnalysis;
};

export const POST = compose(
  authenticatedV2,
  zodParamsPipe(ZAnalysisParams),
  zodBodyPipe(ZAnalysisCreateInput),
  async (req) => {
    const params = getZodParams(req, ZAnalysisParams);
    const input = getZodBody(req, ZAnalysisCreateInput);

    const source = await prisma.dataSource.findUnique({ where: { id: input.dataSourceId } });
    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    if (input.type !== 'ESTIMATION') {
      return NextResponse.json({ error: 'Unsupported analysis type' }, { status: 400 });
    }

    const newAnalysis = await estimation({ ...input, agentId: params.agentId, type: 'ESTIMATION' });

    return NextResponse.json({ data: newAnalysis }, { status: 201 });
  },
);
