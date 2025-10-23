// import { NextRequest, NextResponse } from 'next/server';
// import { DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
// import { s3 } from '@/lib/s3';
// import { createId } from '@paralleldrive/cuid2';
// import { Readable } from 'node:stream';
// import { Upload } from '@aws-sdk/lib-storage';
// import { insightAI } from '@/lib/insight-ai';

// const genFileId = () => `reqfile_${createId()}`;

// export const runtime = 'nodejs'; // dùng Node runtime

// const clearS3 = async () => {
//   const allObj = await s3.send(new ListObjectsV2Command({ Bucket: 'ai-files' }));
//   if (allObj.Contents && allObj.Contents.length > 0) {
//     await s3.send(
//       new DeleteObjectsCommand({
//         Bucket: 'ai-files',
//         Delete: { Objects: allObj.Contents.map((obj) => ({ Key: obj.Key! })) },
//       }),
//     );
//   }
// };

// export const GET = async (request: NextRequest) => {
//   const { searchParams } = new URL(request.url);
//   if (searchParams.get('clear') === 'true') await clearS3();

//   const allObj = await s3.send(new ListObjectsV2Command({ Bucket: 'ai-files' }));
//   return NextResponse.json({ objects: allObj.Contents || [] }, { status: 200 });
// };

// export async function POST(request: NextRequest) {
//   const { searchParams } = new URL(request.url);
//   const actorId = 'system';
//   const projectId = searchParams.get('projectId') || 'demo';
//   const requestId = searchParams.get('requestId') || 'demo';

//   const formData = await request.formData();
//   formData.append('method', 'weighted_average');
//   const estimate = await insightAI.fileEstimate(formData);

//   return NextResponse.json({ estimate });
//   //

//   const file = formData.get('file') as File | null;
//   if (!file) return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });

//   const key = `${actorId}/${projectId}/${requestId}/${genFileId()}`;

//   const ts = new TransformStream();
//   const writer = ts.writable.getWriter();
//   const enc = new TextEncoder();
//   const send = (obj: unknown) => writer.write(enc.encode(JSON.stringify(obj) + '\n'));

//   (async () => {
//     try {
//       const body = Readable.from(file.stream() as any);
//       const up = new Upload({
//         client: s3,
//         params: { Bucket: 'ai-files', Key: key, Body: body, ContentType: file.type },
//         queueSize: 4, // tùy chọn
//         leavePartsOnError: false,
//       });

//       up.on('httpUploadProgress', (p: any) => {
//         const percent = p.total ? Math.round((p.loaded / p.total) * 100) : null;
//         send({ type: 'progress', loaded: p.loaded ?? null, total: p.total ?? null, percent });
//       });

//       await up.done();

//       send({ type: 'done', key, url: `s3://ai-files/${key}` });
//     } catch (err: any) {
//       send({ type: 'error', message: err?.message || 'upload failed' });
//     } finally {
//       writer.close();
//     }
//   })();

//   return new Response(ts.readable, {
//     status: 200,
//     headers: {
//       'Content-Type': 'application/x-ndjson', // mỗi dòng là 1 JSON
//       'Cache-Control': 'no-cache',
//       'X-Accel-Buffering': 'no', // tránh bị proxy buffer
//     },
//   });
// }
