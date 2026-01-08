import { prisma } from '@/lib/prisma';
import { insightAI } from '@/lib/insight-ai';
import { AnalysisMsg } from './schema';
import { getFileBytesFromS3, resolveFileRef } from './file-resolver';

const sanitizeDeep = (value: any): any => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  if (typeof value === 'bigint') return Number(value);
  if (Array.isArray(value)) return value.map(sanitizeDeep);
  if (value && typeof value === 'object') {
    const out: any = {};
    for (const k of Object.keys(value)) {
      const v = (value as any)[k];
      if (v !== undefined) out[k] = sanitizeDeep(v);
    }
    return out;
  }
  if (value instanceof Uint8Array || value instanceof ArrayBuffer || value instanceof Buffer) {
    const v = value instanceof ArrayBuffer ? new Uint8Array(value) : value;
    return `data:application/octet-stream;base64,${Buffer.from(v).toString('base64')}`;
  }

  return value;
};

export async function analyzeDocumentHandler(input: AnalysisMsg) {
  const { analysisId } = input;

  const exists = await prisma.analysis.findUnique({ where: { id: analysisId } });
  if (!exists) throw new Error(`[not-found] Analysis with id ${analysisId} not found`);
  if (!exists.dataSourceId) throw new Error(`[invalid-data] Analysis dataSourceId is missing`);

  await prisma.analysis.update({ where: { id: analysisId }, data: { runStatus: 'PROCESSING' } });

  try {
    const { bucket, key, filename } = await resolveFileRef(exists.dataSourceId);
    const bytes: Uint8Array<any> = await getFileBytesFromS3(bucket, key);

    const formData = new FormData();
    formData.append('file', new Blob([bytes]), filename);
    formData.append('method', 'weighted_average');

    const analysisResult = await insightAI.fileEstimate(formData);

    const sanitizedResult = sanitizeDeep(analysisResult);

    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        output: sanitizedResult,
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
