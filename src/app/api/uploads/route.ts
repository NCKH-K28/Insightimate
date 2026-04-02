import {
  PresignUploadOutput,
  ZPresignUploadInput,
  ZPresignUploadOutput,
} from '@/lib/api/upload-api';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { format } from 'date-fns';
import avatarStorage from '@/lib/s3/avatar-storage';

const uploadRoute = new Hono().basePath('/api/uploads');

uploadRoute.post('/presign', zValidator('json', ZPresignUploadInput), async (c) => {
  const input = c.req.valid('json');
  const kind = input.kind;
  if (kind !== 'org-logo' && kind !== 'user-avatar') throw new Error('Invalid kind');

  const presigner = await avatarStorage.getUploadURL({
    contentType: input.fileType,
    prefix: kind,
    expiresIn: 900, // 15 phút
    metadata: { fileName: input.fileName, fileType: input.fileType },
  });

  const result: PresignUploadOutput = {
    assetKey: presigner.key,
    uploadURL: presigner.url,
    publicURL: null,
    expiresAt: format(presigner.expiresAt, "yyyy-MM-dd'T'HH:mm:ssXXX"),
  };

  return c.json(ZPresignUploadOutput.parse(result));
});

export const GET = handle(uploadRoute);
export const POST = handle(uploadRoute);
export const PUT = handle(uploadRoute);
export const PATCH = handle(uploadRoute);
