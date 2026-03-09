/**
 * POST /api/analyze
 * 用豆包 Vision 分析场景照片，返回场景信息 + 故事方向建议
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { analyzeScenePhotos, analyzeCharacterPhoto } from '@/lib/doubao';
import { suggestThemes } from '@/lib/deepseek';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sceneImageUrls, characterImageUrl, characterName } = req.body as {
    sceneImageUrls?: string[];
    characterImageUrl?: string;
    characterName?: string;
  };

  if (!sceneImageUrls?.length) {
    return res.status(400).json({ error: '请提供场景照片 URL' });
  }

  try {
    // 并行：分析场景 + 分析角色
    const [sceneAnalysis, characterDescription] = await Promise.all([
      analyzeScenePhotos(sceneImageUrls),
      characterImageUrl && characterName
        ? analyzeCharacterPhoto(characterImageUrl, characterName)
        : Promise.resolve(characterName ? `可爱的小朋友${characterName}` : '可爱的小朋友'),
    ]);

    // 根据场景推荐故事方向
    const themes = await suggestThemes({
      sceneAnalysis,
      characterName: characterName ?? '小主角',
    });

    return res.status(200).json({
      sceneAnalysis,
      characterDescription,
      suggestedThemes: themes,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('analyze error:', msg);
    return res.status(503).json({ error: `分析失败: ${msg}` });
  }
}
