import { NextApiRequest, NextApiResponse } from 'next';
import { uploadBuffer } from '@/lib/gcs';
import { normalizeImageToJpeg } from '@/lib/image-utils';

export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as { filename?: string; contentType?: string; fileBase64?: string } | undefined;
    if (!body) {
      return res.status(400).json({ error: '请求体为空' });
    }
    const { filename, contentType, fileBase64 } = body;
    if (!filename || !contentType || !fileBase64) {
      return res.status(400).json({ error: '缺少 filename、contentType 或 fileBase64' });
    }

    const rawBuffer = Buffer.from(fileBase64, 'base64');
    const { buffer, filename: outFilename, contentType: outContentType } = await normalizeImageToJpeg(
      rawBuffer,
      contentType,
      filename
    );
    const publicUrl = await uploadBuffer(outFilename, outContentType, buffer);
    res.status(200).json({ publicUrl });
  } catch (error) {
    console.error('Upload file API error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: '上传失败' });
    }
  }
}
