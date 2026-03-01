import { NextApiRequest, NextApiResponse } from 'next';
import { generateImage } from '@/lib/jimeng';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, style, referenceImageUrl } = req.body;
    const imageUrl = await generateImage({ prompt, style, referenceImageUrl });
    res.status(200).json({ imageUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate image';
    console.error('[generate-image]', message);
    if (error instanceof Error && error.stack) console.error(error.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  }
}
