import {
  CreateBucketCommand,
  ListBucketsCommand,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import z from 'zod';

const MINIO_API_URL = process.env.MINIO_API_URL || 'http://localhost:9000';

const endpoint = z.url().parse(MINIO_API_URL);

// MinIO client
const MinIOConfig: S3ClientConfig = {
  endpoint: endpoint,
  region: 'us-east-1',
  forcePathStyle: true, // needed with minio?
  credentials: {
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
  },
};

export const s3 = new S3Client(MinIOConfig);

// gen bucket
const init = async () => {
  try {
    const buckets = await s3.send(new ListBucketsCommand({ Prefix: 'ai-files', MaxBuckets: 1 }));
    const exists = buckets.Buckets?.some((b) => b.Name === 'ai-files');
    if (exists) return;

    await s3.send(new CreateBucketCommand({ Bucket: 'ai-files' }));
    console.log('Bucket created successfully');
  } catch (error) {
    console.error('Error creating bucket:', error);
  }
};

await init();
