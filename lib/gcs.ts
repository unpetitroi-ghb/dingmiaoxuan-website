import { Storage } from '@google-cloud/storage';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const storage = new Storage({
  keyFilename: path.join(process.cwd(), process.env.GCS_KEY_FILE!),
});

const bucketName = process.env.GCS_BUCKET_NAME!;
const bucket = storage.bucket(bucketName);

export async function generateUploadSignedUrl(
  filename: string,
  contentType: string
): Promise<{ signedUrl: string; publicUrl: string }> {
  const ext = path.extname(filename);
  const blobName = `uploads/${uuidv4()}${ext}`;
  const file = bucket.file(blobName);

  const [signedUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });

  const publicUrl = `https://storage.googleapis.com/${bucketName}/${blobName}`;
  return { signedUrl, publicUrl };
}

/** 服务端直接上传文件到 GCS，避免浏览器直传时的 CORS 问题 */
export async function uploadBuffer(
  filename: string,
  contentType: string,
  buffer: Buffer
): Promise<string> {
  const ext = path.extname(filename);
  const blobName = `uploads/${uuidv4()}${ext}`;
  const file = bucket.file(blobName);
  await file.save(buffer, {
    contentType,
    metadata: { contentType },
  });
  return `https://storage.googleapis.com/${bucketName}/${blobName}`;
}

export async function deleteFile(publicUrl: string) {
  const pathname = new URL(publicUrl).pathname;
  const blobName = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const file = bucket.file(blobName);
  await file.delete();
}
