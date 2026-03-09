/**
 * POST /api/generate-story
 * 调用 DeepSeek 根据图片分析结果 + 用户创意，生成绘本脚本（分镜）
 */
import { NextApiRequest, NextApiResponse } from 'next';
import { generateComicScript } from '@/lib/deepseek';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    characterName,
    imageAnalysis,
    imageAnalysisDescription,
    userStoryIdea,
    style,
    pageCount,
  } = req.body as {
    characterName?: string;
    imageAnalysis?: { summary: string; labels: string[] };
    imageAnalysisDescription?: string;
    userStoryIdea?: string;
    style?: string;
    pageCount?: number;
  };

  if (!characterName) {
    return res.status(400).json({ error: '请提供角色名称 characterName' });
  }

  try {
    const result = await generateComicScript({
      characterName: characterName || '小主角',
      imageAnalysis,
      imageAnalysisDescription,
      userStoryIdea: userStoryIdea || '',
      style: style || '绘本',
      pageCount: typeof pageCount === 'number' ? pageCount : 6,
    });

    return res.status(200).json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('generate-story error:', e);
    return res.status(503).json({
      error: 'GENERATE_STORY_FAILED',
      message: `故事生成失败：${msg}`,
    });
  }
}
