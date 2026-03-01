import { NextApiRequest, NextApiResponse } from 'next';
import { uploadBuffer } from '@/lib/gcs';

export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename, contentType, fileBase64 } = req.body;
    if (!filename || !contentType || !fileBase64) {
      return res.status(400).json({ error: 'Missing filename, contentType or fileBase64' });
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    const publicUrl = await uploadBuffer(filename, contentType, buffer);
    res.status(200).json({ publicUrl });
  } catch (error) {
    console.error('Upload file API error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
}
