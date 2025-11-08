// src/workers/analyze-document/handler.ts
import { prisma } from '@/lib/prisma';
import { insightAI } from '@/lib/insight-ai';
import { AnalysisMsg } from './schema';
import { getFileBytesFromS3, resolveFileRef } from './file-resolver';

export async function analyzeDocumentHandler(input: AnalysisMsg) {
  const { analysisId } = input;

  await prisma.analysis.updateMany({
    where: { id: analysisId },
    data: { runStatus: 'PROCESSING' },
  });

  try {
    const analysis = await prisma.analysis.findUnique({ where: { id: analysisId } });
    if (!analysis) throw new Error(`Analysis not found: ${analysisId}`);

    if (!analysis.dataSourceId) throw new Error(`Analysis ${analysisId} missing dataSourceId`);

    const { bucket, key } = await resolveFileRef(analysis.dataSourceId);
    const bytes: Uint8Array<any> = await getFileBytesFromS3(bucket, key);

    const formData = new FormData();
    formData.append('file', new Blob([bytes]), 'document.pdf');
    formData.append('method', 'weighted_average');

    const analysisResult = await insightAI.fileEstimate(formData);

    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        output: analysisResult,
        processedAt: new Date(),
        runStatus: 'COMPLETED',
      },
    });

    return analysisResult;
  } catch (err) {
    await prisma.analysis.updateMany({
      where: { id: analysisId, runStatus: 'PROCESSING' },
      data: { runStatus: 'FAILED', processedAt: new Date() },
    });
    throw err;
  }
}
