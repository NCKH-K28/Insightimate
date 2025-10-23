import { s3 } from '@/lib/s3';
import { ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { createId } from '@paralleldrive/cuid2';

const genFileId = () => `reqfile_${createId()}`;

const clearS3 = async () => {
  const allObj = await s3.send(new ListObjectsV2Command({ Bucket: 'ai-files' }));
  if (allObj.Contents && allObj.Contents.length > 0) {
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: 'ai-files',
        Delete: { Objects: allObj.Contents.map((obj) => ({ Key: obj.Key! })) },
      }),
    );
  }
};

const presigned = async (key: string) => {};
