/**
 * POST /api/generate-image
 * 调用即梦 4.0 生成单张插画，返回图片 URL
 */
import { NextApiRequest, NextApiResponse } from 'next';
import { generateImage } from '@/lib/jimeng';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, style, referenceImageUrl } = req.body as {
    prompt?: string;
    style?: string;
    referenceImageUrl?: string;
  };

  if (!prompt) {
    return res.status(400).json({ error: '请提供 prompt' });
  }

  // 构建最终 prompt：在用户 prompt 基础上附加风格和文字留白提示
  const styleHint = style ? `，${style}风格` : '';
  const fullPrompt = `${prompt}${styleHint}，儿童绘本插画，温馨可爱，图面下方留出空白区域用于放置文字，高质量`;

  try {
    const imageUrl = await generateImage({
      prompt: fullPrompt,
      style,
      referenceImageUrl,
    });

    return res.status(200).json({ imageUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('generate-image error:', e);
    return res.status(503).json({
      error: 'GENERATE_IMAGE_FAILED',
      message: `图片生成失败：${msg}`,
    });
  }
}
