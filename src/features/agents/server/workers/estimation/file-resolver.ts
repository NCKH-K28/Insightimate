// src/workers/analyze-document/file-resolver.ts
import { prisma } from '@/lib/prisma';
import { s3 } from '@/lib/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';

const streamToBuffer = async (stream: Readable): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

export async function getFileBytesFromS3(bucket: string, key: string): Promise<Uint8Array> {
  const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!Body) throw new Error('S3 object Body is empty');

  if (typeof (Body as any).transformToByteArray === 'function') {
    return (Body as any).transformToByteArray();
  }

  if (Body instanceof Readable) {
    const buf = await streamToBuffer(Body);
    return new Uint8Array(buf);
  }

  throw new Error('Unsupported S3 Body type');
}

export async function resolveFileRef(sourceId: string) {
  const source = await prisma.dataSource.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error(`DataSource not found: ${sourceId}`);

  const fileRef = await prisma.fileReference.findUnique({ where: { id: source.sourceId } });
  if (!fileRef) throw new Error(`FileReference not found for source: ${sourceId}`);

  const bucket = process.env.S3_BUCKET_NAME || 'ai-files';
  return { bucket, key: fileRef.key };
}
