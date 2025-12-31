import serverConfig from '@/configs/server';
import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';

const minioConfig = serverConfig.minio;
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

const minioClient = new S3Client(MinIOConfig);
export default minioClient;
