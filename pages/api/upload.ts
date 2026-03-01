import { NextApiRequest, NextApiResponse } from 'next';
import { generateUploadSignedUrl } from '@/lib/gcs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) {
      return res.status(400).json({ error: 'Missing filename or contentType' });
    }

    const { signedUrl, publicUrl } = await generateUploadSignedUrl(filename, contentType);
    res.status(200).json({ signedUrl, publicUrl });
  } catch (error) {
    console.error('Upload API error:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
}
