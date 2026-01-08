import {
  CreateBucketCommand,
  ListBucketsCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import s3Client from './client';
import { createId as cuid } from '@paralleldrive/cuid2';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const BUCKET_NAME = 'ai-storage';
const int = async () => {
  // find existing buckets
  const buckets = await s3Client.send(new ListBucketsCommand({}));
  const bucketExists = buckets.Buckets?.some((b) => b.Name === BUCKET_NAME);
  if (bucketExists === true) return;
  await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
};

int();

// ================== Types ================== //
type ObjectBody = Buffer | Uint8Array | Blob | string;
// type FilePart = { type: 'file'; mediaType: string; data: string };

const getBucketName = () => BUCKET_NAME;
const genObjectKey = (prefix = 'obj', suffix: string = '') => `${prefix}-${cuid()}${suffix}`;

const getBaseURL = async (overrideEndpoint?: string) => {
  if (overrideEndpoint) return overrideEndpoint.replace(/\/$/, '');
  const endpoint = s3Client.config.endpoint; // Provider<Endpoint>
  if (!endpoint) throw new Error('S3 Client endpoint is not defined');
  const endpointValue = typeof endpoint === 'function' ? await endpoint() : endpoint;
  const protocol = endpointValue.protocol || 'http:';
  const host = endpointValue.hostname;
  const port = endpointValue.port ? `:${endpointValue.port}` : '';
  return `${protocol}//${host}${port}`;
};

const buildObjectURL = async (key: string, overrideEndpoint?: string) => {
  const bucket = getBucketName();
  const baseURL = await getBaseURL(overrideEndpoint);
  const encodedKey = encodeURIComponent(key);
  return `${baseURL}/${bucket}/${encodedKey}`;
};

export const uploadObject = async (params: {
  body: ObjectBody;
  key?: string;
  prefix?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  baseUrl?: string; // optional override để build URL
}): Promise<{ key: string; url: string }> => {
  const bucket = getBucketName();
  const key = params.key ?? genObjectKey(params.prefix);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: params.body,
      ContentType: params.contentType,
      Metadata: params.metadata,
    }),
  );

  const url = await buildObjectURL(key, params.baseUrl);
  return { key, url };
};

export const deleteObject = async (key: string): Promise<void> => {
  const bucket = getBucketName();
  await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
};

export const getObjectMetadata = async (key: string) => {
  const bucket = getBucketName();
  const cmd = new HeadObjectCommand({ Bucket: bucket, Key: key });
  return s3Client.send(cmd);
};

const getUploadURL = async (params: {
  key?: string;
  prefix?: string;
  contentType?: string;
  expiresIn?: number;
  metadata?: Record<string, string>;
}): Promise<{
  key: string;
  url: string;
  expiresAt: number;
  expiresIn: number;
}> => {
  const expiresIn = params.expiresIn ?? 3600;

  const bucket = getBucketName();
  const key = params.key ?? genObjectKey(params.prefix);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: params.contentType,
    Metadata: params.metadata,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  const expiresAt = Date.now() + expiresIn * 1000;
  const result = { key, url, expiresAt, expiresIn };

  return result;
};

export const getDownloadURL = async (
  key: string,
  expiresIn = 600, // 10 phút là đủ cho 1 request AI
): Promise<string> => {
  const bucket = getBucketName();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn });
};

const aiStorage = {
  bucketName: getBucketName(),
  upload: uploadObject,
  delete: deleteObject,
  url: buildObjectURL,
  head: getObjectMetadata,
  getUploadURL,
  getDownloadURL,
};

export default aiStorage;
