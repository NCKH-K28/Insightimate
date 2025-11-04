// src/workers/analyzeDocument.kafka.ts
import { prisma } from '@/lib/prisma';
import { insightAI } from '@/lib/insight-ai';
import { s3 } from '@/lib/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { kafka } from '@/lib/kafka';
import { Readable } from 'node:stream';
import { z } from 'zod';

/**
 * Message schema
 */
const AnalysisMsg = z.object({
  analysisId: z.string().min(1),
  dataSourceId: z.string().min(1),
  agentId: z.string().min(1),
});
type AnalysisMsg = z.infer<typeof AnalysisMsg>;

/**
 * Helpers
 */
const streamToBuffer = async (stream: Readable): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

async function getFileBytesFromS3(bucket: string, key: string): Promise<Uint8Array<any>> {
  const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!Body) throw new Error('S3 object Body is empty');

  return Body.transformToByteArray();

  // if (typeof Body.transformToByteArray === 'function') {
  //   return await Body.transformToByteArray();
  // }

  // if (Body instanceof Readable) {
  //   const buf = await streamToBuffer(Body);
  //   return new Uint8Array(buf);
  // }

  // throw new Error('Unsupported S3 Body type');
}

/**
 * Resolve file reference for a given data source
 * Adjust field names if your schema differs.
 */
async function resolveFileRef(sourceId: string) {
  const source = await prisma.dataSource.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error(`DataSource not found: ${sourceId}`);

  const fileRef = await prisma.fileReference.findUnique({ where: { id: source.sourceId } });
  if (!fileRef) throw new Error(`FileReference not found for source: ${sourceId}`);

  const s3Key = fileRef.fileURL;

  if (s3Key) return { bucket: process.env.S3_BUCKET ?? 'ai-files', key: s3Key };

  let bucket = process.env.S3_BUCKET ?? 'ai-files';
  let finalKey = s3Key;
  if (s3Key.startsWith('s3://')) {
    const [, , bkt, ...rest] = s3Key.split('/');
    bucket = bkt;
    finalKey = rest.join('/');
  }

  return { bucket, key: finalKey };
}

/**
 * Core handler
 * Ensures only one worker processes a job via updateMany guard.
 */
export async function analyzeDocumentHandler(input: AnalysisMsg) {
  const { analysisId } = input;

  const claimed = await prisma.analysis.updateMany({
    where: { id: analysisId },
    data: { runStatus: 'PROCESSING' },
  });
  if (claimed.count === 0) return;

  try {
    const analysis = await prisma.analysis.findUnique({ where: { id: analysisId } });
    if (!analysis) throw new Error(`Analysis not found: ${analysisId}`);

    const sourceId = analysis.dataSourceId;
    if (!sourceId) throw new Error(`Analysis ${analysisId} missing dataSourceId`);

    const { bucket, key } = await resolveFileRef(sourceId);

    const bytes = await getFileBytesFromS3(bucket, key);
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

export const startAnalyzeDocumentConsumer = () => {
  const consumer = kafka.consumer({ groupId: 'analyze-document-group' });

  let shuttingDown = false;

  const run = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'agents.analysis.created', fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ message }) => {
        if (shuttingDown) return;

        try {
          if (!message.value) return;
          const parsed = AnalysisMsg.safeParse(JSON.parse(message.value.toString()));
          if (!parsed.success) {
            console.error('[analyzeDocument] Invalid payload', parsed.error.flatten());
            return;
          }

          await analyzeDocumentHandler(parsed.data);
        } catch (e) {
          // Optional: produce to a DLQ here with original payload + error
          console.error('[analyzeDocument] Processing error:', e);
          // Re-throwing would crash consumer loop; we log and continue.
        }
      },
    });
  };

  run().catch((e) => {
    console.error('[analyzeDocument] Fatal consumer error:', e);
    process.exitCode = 1;
  });

  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    try {
      await consumer.disconnect();
    } catch (e) {
      console.error('[analyzeDocument] Error on shutdown:', e);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};
