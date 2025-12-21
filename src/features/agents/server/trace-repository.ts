import { prisma } from '@/lib/prisma';
import { AgentPlan } from './types';

export interface TraceData {
  runId: string;
  userId: string;
  agentId?: string;
  input: string;
  plan?: AgentPlan;
  steps?: any[];
  finalOutput?: string;
  durationMs?: number;
  status: 'SUCCESS' | 'FAILED';
}

export class TraceRepository {
  async save(trace: TraceData) {
    console.log('[TraceRepository] Saving trace:', trace.runId);
    await prisma.agentTrace.create({
      data: {
        runId: trace.runId,
        userId: trace.userId,
        agentId: trace.agentId,
        input: trace.input,
        plan: trace.plan as any,
        steps: trace.steps as any,
        finalOutput: trace.finalOutput,
        durationMs: trace.durationMs,
        status: trace.status,
      },
    });
  }

  async getTraces(userId: string) {
    return prisma.agentTrace.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}

export const traceRepository = new TraceRepository();
