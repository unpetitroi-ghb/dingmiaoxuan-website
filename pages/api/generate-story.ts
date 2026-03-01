import { NextApiRequest, NextApiResponse } from 'next';
import { generateComicScript } from '@/lib/deepseek';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { characterName, imageAnalysisDescription, imageAnalysis, userStoryIdea, style, pageCount } = req.body;

    const story = await generateComicScript({
      characterName: characterName || '暖暖',
      imageAnalysisDescription: imageAnalysisDescription ?? '',
      imageAnalysis: imageAnalysis && typeof imageAnalysis.summary === 'string'
        ? { summary: imageAnalysis.summary, labels: Array.isArray(imageAnalysis.labels) ? imageAnalysis.labels : [] }
        : undefined,
      userStoryIdea: userStoryIdea ?? '',
      style: style || '水彩',
      pageCount: pageCount ?? 6,
    });

    res.status(200).json(story);
  } catch (error) {
    console.error('Generate story error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate story',
    });
  }
}
