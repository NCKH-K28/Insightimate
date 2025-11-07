import { ZAnalysisCreateInput } from '@/contracts/agents';
import { authenticatedV2 } from '@/lib/auth';
import { compose } from '@/lib/http/api-compose';
import { getZodBody, getZodParams, zodBodyPipe, zodParamsPipe } from '@/lib/http/zod-pipes';
import { kafka } from '@/lib/kafka';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import z from 'zod';

const ZAnalysisParams = z.object({ agentId: z.string() });

export const GET = async () => {
  const analysis = await prisma.analysis.findMany();
  const result = { data: analysis };

  return NextResponse.json(result);
};

export const POST = compose(
  authenticatedV2,
  zodParamsPipe(ZAnalysisParams),
  zodBodyPipe(ZAnalysisCreateInput),
  async (req, res) => {
    const params = getZodParams(req, ZAnalysisParams);
    const input = getZodBody(req, ZAnalysisCreateInput);

    const producer = kafka.producer();
    await producer.connect();

    const s = await prisma.dataSource.findUnique({ where: { id: input.dataSourceId } });
    if (!s) return NextResponse.json({ error: 'Source not found' }, { status: 404 });

    // Create a new analysis record
    const newAnalysis = await prisma.analysis.create({
      data: {
        id: `analysis_${Math.random().toString(36).substring(2, 15)}`,
        dataSourceId: input.dataSourceId,
        agentId: params.agentId,
        runStatus: 'PENDING',
      },
    });

    // push kafka message to start analysis
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

    return NextResponse.json(newAnalysis);
  },
);
