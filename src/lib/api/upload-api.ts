import { z } from 'zod';
import axiosInstance from './_client';

const ZKind = z.enum(['org-logo', 'user-avatar']);
export const MAX_BY_KIND: Record<z.infer<typeof ZKind>, number> = {
  'org-logo': 2 * 1024 * 1024,
  'user-avatar': 2 * 1024 * 1024,
};

export const ALLOWED_MIME_BY_KIND: Record<z.infer<typeof ZKind>, readonly string[]> = {
  'org-logo': ['image/png', 'image/jpeg', 'image/webp'],
  'user-avatar': ['image/png', 'image/jpeg', 'image/webp'],
};

export const ZPresignUploadInput = z
  .object({
    kind: ZKind,
    fileName: z.string().min(1).max(255),
    fileSize: z.number().int().positive(),
    fileType: z.string().min(1),
  })
  .superRefine((data, ctx) => {
    const allowedMimes = ALLOWED_MIME_BY_KIND[data.kind];
    if (!allowedMimes.includes(data.fileType)) {
      const msg = `Invalid file type. Allowed types: ${allowedMimes.join(', ')}`;
      ctx.addIssue({ code: 'custom', message: msg });
    }

    const maxSize = MAX_BY_KIND[data.kind];
    if (data.fileSize > maxSize) {
      const msg = `File size exceeds the maximum allowed size of ${maxSize} bytes.`;
      ctx.addIssue({ code: 'custom', message: msg });
    }
  });

export const ZPresignUploadOutput = z.object({
  uploadURL: z.url(),
  publicURL: z.url().nullable(),
  assetKey: z.string(),
  expiresAt: z.string(),
});

export type PresignUploadInput = z.infer<typeof ZPresignUploadInput>;
export type PresignUploadOutput = z.infer<typeof ZPresignUploadOutput>;

const UPLOAD_API_BASE = '/uploads';
const PRESIGN_ENDPOINT = `${UPLOAD_API_BASE}/presign`;
export async function presignUpload(input: PresignUploadInput): Promise<PresignUploadOutput> {
  const resp = await axiosInstance.post(PRESIGN_ENDPOINT, input);
  return ZPresignUploadOutput.parse(resp.data);
}

export const uploadAPI = { presign: presignUpload };
