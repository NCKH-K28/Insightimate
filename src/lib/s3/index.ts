import {
  CreateBucketCommand,
  ListBucketsCommand,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3';

// MinIO client
const MinIOConfig: S3ClientConfig = {
  endpoint: 'http://localhost:9000',
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
    // check
    const buckets = await s3.send(new ListBucketsCommand({ Prefix: 'ai-files' }));
    const exists = buckets.Buckets?.some((b) => b.Name === 'ai-files');
    if (exists) {
      console.log('Bucket already exists');
      return;
    }

    // create
    await s3.send(new CreateBucketCommand({ Bucket: 'ai-files' }));
    console.log('Bucket created successfully');
  } catch (error) {
    console.error('Error creating bucket:', error);
  }
};

await init();
