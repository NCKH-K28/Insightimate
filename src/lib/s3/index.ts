import { CreateBucketCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';

// MinIO client
const MinIOConfig: S3ClientConfig = {
  endpoint: 'http://103.141.177.146:9000',
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
    await s3.send(new CreateBucketCommand({ Bucket: 'ai-files' }));
    console.log('Bucket created successfully');
  } catch (error) {
    console.error('Error creating bucket:', error);
  }
};

await init();
