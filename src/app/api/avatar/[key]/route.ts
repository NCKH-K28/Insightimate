export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import avatarStorage from '@/lib/minio/avatar-storage';
import { compose } from '@/lib/http/api-compose';
import { Readable } from 'node:stream';

export const GET = compose<{ key: string }>(async (req) => {
  const key = req.params.key;

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
