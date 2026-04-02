import avatarStorage from '@/lib/s3/avatar-storage';
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { Readable } from 'stream';
import { lookup as lookupMimeType } from 'mime-types';
import z from 'zod';
import { zValidator } from '@hono/zod-validator';

const SUPPORTED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg'];
const ALLOW_MEDIA_TYPES = SUPPORTED_EXTENSIONS.map((ext) => lookupMimeType(ext)).filter(
  (mt): mt is string => typeof mt === 'string',
);

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ZUploadURLInput = z.object({
  filename: z.string().min(1).max(255),
  mediaType: z.enum(ALLOW_MEDIA_TYPES),
  size: z.number().max(MAX_SIZE),
});

const avatarRoute = new Hono().basePath('/api/avatar');

// upload-url
avatarRoute.post('/upload-url', zValidator('json', ZUploadURLInput), async (c) => {
  const input = c.req.valid('json');
  const uploadURL = await avatarStorage.getUploadURL({
    contentType: input.mediaType,
    metadata: { filename: input.filename, mediaType: input.mediaType },
  });
  const result = {
    ...uploadURL,
    metadata: { filename: input.filename, mediaType: input.mediaType },
  };
  return c.json(result);
});

avatarRoute.get('/:key', async (c) => {
  const key = c.req.param('key');
  if (!key) throw new Error('Invalid key');
  const { body, contentType, contentLength } = await avatarStorage.streamObject(key);
  const webStream = Readable.toWeb(body) as ReadableStream;
  return new Response(webStream, {
    headers: {
      'Content-Type': contentType ?? 'application/octet-stream',
      ...(contentLength ? { 'Content-Length': String(contentLength) } : {}),
      'Cache-Control': 'private, max-age=0',
    },
  });
});

export const GET = handle(avatarRoute);
export const POST = handle(avatarRoute);
export const PUT = handle(avatarRoute);
export const PATCH = handle(avatarRoute);
