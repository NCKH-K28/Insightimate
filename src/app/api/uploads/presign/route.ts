import {
  PresignUploadOutput,
  ZPresignUploadInput,
  ZPresignUploadOutput,
} from '@/lib/api/upload-api';
import { compose } from '@/lib/http/api-compose';
import { getZodBody, zodBodyPipe } from '@/lib/http/zod-pipes';
import avatarStorage from '@/lib/s3/avatar-storage';
import { format } from 'date-fns';
import { NextResponse } from 'next/server';

export const POST = compose(zodBodyPipe(ZPresignUploadInput), async (req) => {
  const input = getZodBody(req, ZPresignUploadInput);
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

  return NextResponse.json(ZPresignUploadOutput.parse(result));
});
