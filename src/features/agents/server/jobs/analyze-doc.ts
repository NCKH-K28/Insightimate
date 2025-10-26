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
        prisma.analysis.findUnique({ where: { id: analysisId } }),
      );
      if (!analysis) return;

      await step.run('mark processing', () =>
        prisma.analysis.update({
          where: { id: analysisId },
          data: { runStatus: 'PROCESSING' },
        }),
      );

      const sourceId = analysis.dataSourceId;
      if (!sourceId) return;

      const source = await step.run('load source', () => {
        return prisma.dataSource.findUnique({ where: { id: sourceId } });
      });
      if (!source) return;

      const fileRef = await step.run('load fileRef', () =>
        prisma.fileReference.findUnique({ where: { id: sourceId } }),
      );
      if (!fileRef) return;

      const { Body } = await s3.send(
        new GetObjectCommand({ Bucket: 'ai-files', Key: fileRef.fileURL }),
      );
      if (!Body) return;
      // get file
      const bytes: Uint8Array<any> = await Body.transformToByteArray();
      const formData = new FormData();
      formData.append('file', new Blob([bytes]), 'document.pdf');
      formData.append('method', 'weighted_average');

      const analysisResult = await step.run('call insightAI', () =>
        insightAI.fileEstimate(formData),
      );

      await step.run('mark completed', () =>
        prisma.analysis.update({
          where: { id: analysisId },
          data: {
            output: analysisResult,
            processedAt: new Date(),
            runStatus: 'COMPLETED',
          },
        }),
      );
    } catch (err) {
      // Gợi ý: ghi nhận thất bại rõ ràng để tránh kẹt ở PROCESSING
      await step.run('mark failed', () =>
        prisma.analysis.update({
          where: { id: analysisId },
          data: { runStatus: 'FAILED' },
        }),
      );
      throw err;
    }
  },
);
