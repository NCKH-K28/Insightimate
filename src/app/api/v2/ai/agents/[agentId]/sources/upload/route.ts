import { authenticatedV2, getAuthFromRequest } from '@/lib/auth';
import { compose } from '@/lib/http/api-compose';
import { s3 } from '@/lib/s3';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { Upload } from '@aws-sdk/lib-storage';
import z from 'zod';
import { prisma } from '@/lib/prisma';

const ZParams = z.object({ agentId: z.string().min(1) });

const genFileId = () => `reqfile_${Math.random().toString(36).substring(2, 15)}`;

export const GET = async (request: NextRequest) => {
  const allObj = await s3.send(new ListObjectsV2Command({ Bucket: 'ai-files' }));
  return NextResponse.json({ objects: allObj.Contents || [] }, { status: 200 });
};

export const POST = compose(authenticatedV2, async (req, res) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const params = ZParams.parse(req.params);
  const formData = await req.formData();
  const fileRefId = genFileId();
  const key = `${actorId}/${params.agentId}/${fileRefId}`;
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const body = file.stream() as any;
  const up = new Upload({
    client: s3,
    params: { Bucket: 'ai-files', Key: key, Body: body, ContentType: file.type },
    queueSize: 4, // tùy chọn
    leavePartsOnError: false,
  });

  await up.done();

  const result = await prisma.$transaction(async (tx) => {
    await tx.aIFileRef.create({
      data: {
        id: fileRefId,
        name: file.name,
        url: key,
        metadata: { size: file.size, type: file.type },
      },
    });

    return await tx.agentSource.create({
      data: {
        id: `agent_source_${Math.random().toString(36).substring(2, 15)}`,
        agentId: params.agentId,
        sourceType: 'FILE',
        sourceId: fileRefId,
        source: { value: fileRefId, label: file.name },
      },
    });
  });

  return NextResponse.json({ data: result }, { status: 200 });
});
