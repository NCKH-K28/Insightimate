import 'server-only';
export const runtime = 'nodejs';

import { inngest } from '@/lib/inngest';
import { prisma } from '@/lib/prisma';
import { insightAI } from '@/lib/insight-ai';
import { s3 } from '@/lib/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export const analyzeDocument = inngest.createFunction(
  { id: 'analyze-document' },
  { event: 'agents/analysis.created' },
  async ({ event, step }) => {
    const { analysisId } = event.data;

    try {
      const analysis = await step.run('load analysis', () =>
        prisma.aIAnalysis.findUnique({ where: { id: analysisId } }),
      );
      if (!analysis) return;

      await step.run('mark processing', () =>
        prisma.aIAnalysis.update({
          where: { id: analysisId },
          data: { status: 'PROCESSING' },
        }),
      );

      const source = await step.run('load source', () =>
        prisma.agentSource.findUnique({ where: { id: analysis.aSourceId } }),
      );
      if (!source) return;

      const fileRef = await step.run('load fileRef', () =>
        prisma.aIFileRef.findUnique({ where: { id: source.sourceId } }),
      );
      if (!fileRef) return;

      const { Body } = await s3.send(
        new GetObjectCommand({ Bucket: 'ai-files', Key: fileRef.url }),
      );
      if (!Body) return;
      // get file
      const bytes = await Body.transformToByteArray();
      const formData = new FormData();
      formData.append('file', new Blob([bytes]), 'document.pdf');
      formData.append('method', 'weighted_average');

      const analysisResult = await step.run('call insightAI', () =>
        insightAI.fileEstimate(formData),
      );

      await step.run('mark completed', () =>
        prisma.aIAnalysis.update({
          where: { id: analysisId },
          data: {
            result: analysisResult,
            status: 'COMPLETED',
            processedAt: new Date(),
          },
        }),
      );
    } catch (err) {
      // Gợi ý: ghi nhận thất bại rõ ràng để tránh kẹt ở PROCESSING
      await step.run('mark failed', () =>
        prisma.aIAnalysis.update({
          where: { id: analysisId },
          data: { status: 'FAILED' },
        }),
      );
      throw err;
    }
  },
);
