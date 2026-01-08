import { NextRequest, NextResponse } from 'next/server';
import avatarStorage from '@/lib/s3/avatar-storage';
import { lookup as lookupMimeType } from 'mime-types';
import z from 'zod';

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

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  const parsedInput = ZUploadURLInput.safeParse(body);
  if (!parsedInput.success) {
    const msg = parsedInput.error.issues.map((e) => e.message).join(', ');
    return new Response(JSON.stringify({ message: msg }), { status: 400 });
  }

  const { filename, mediaType } = parsedInput.data;
  const uploadURL = await avatarStorage.getUploadURL({
    contentType: mediaType,
    metadata: { filename, mediaType },
  });
  const result = { ...uploadURL, metadata: { filename, mediaType } };

  return NextResponse.json(result);
};
