import serverConfig from '@/configs/server';
import {
  CreateBucketCommand,
  ListBucketsCommand,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3';

const minioConfig = serverConfig.minio;
const s3Config = serverConfig.s3;
const endpoint = minioConfig.apiURL;

// MinIO client
const MinIOConfig: S3ClientConfig = {
  endpoint: endpoint,
  region: 'us-east-1',
  forcePathStyle: true, // needed with minio?
  credentials: {
    accessKeyId: minioConfig.accessKeyId,
    secretAccessKey: minioConfig.secretAccessKey,
  },
};

export const s3 = new S3Client(MinIOConfig);

// gen bucket
const init = async () => {
  try {
    const bucket = s3Config.bucketName;
    const buckets = await s3.send(new ListBucketsCommand({ Prefix: bucket, MaxBuckets: 1 }));
    const exists = buckets.Buckets?.some((b) => b.Name === bucket);
    if (exists) return;

    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log('Bucket created successfully');
  } catch (error) {
    console.error('Error creating bucket:', error);
  }
};

await init();
