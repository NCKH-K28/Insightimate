import { prisma } from '@/lib/prisma';
import { insightAI } from '@/lib/insight-ai';
import { AnalysisMsg } from './schema';
import { getFileBytesFromS3, resolveFileRef } from './file-resolver';

export async function analyzeDocumentHandler(input: AnalysisMsg) {
  const { analysisId } = input;

  const exists = await prisma.analysis.findUnique({ where: { id: analysisId } });
  if (!exists) throw new Error(`[not-found] Analysis with id ${analysisId} not found`);
  if (!exists.dataSourceId) throw new Error(`[invalid-data] Analysis dataSourceId is missing`);

  await prisma.analysis.update({ where: { id: analysisId }, data: { runStatus: 'PROCESSING' } });

  try {
    const { bucket, key } = await resolveFileRef(exists.dataSourceId);
    const bytes: Uint8Array<any> = await getFileBytesFromS3(bucket, key);

    const formData = new FormData();
    formData.append('file', new Blob([bytes]), 'document.pdf');
    formData.append('method', 'weighted_average');

    const analysisResult = await insightAI.fileEstimate(formData);

    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        output: JSON.parse(JSON.stringify(analysisResult)),
        processedAt: new Date(),
        runStatus: 'COMPLETED',
      },
    });

    return analysisResult;
  } catch (err) {
    await prisma.analysis.updateMany({
      where: { id: analysisId },
      data: { runStatus: 'FAILED', processedAt: new Date() },
    });

    throw err;
  }
}
