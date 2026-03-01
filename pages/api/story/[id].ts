import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { generateStorySummaryAndThemes } from '@/lib/deepseek';
import type { ClueAnalysisItem } from '@/lib/deepseek';
import type { CharacterSummaryForStory } from '@/lib/deepseek';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string;
  if (!id) {
    return res.status(400).json({ error: '缺少 id' });
  }

  if (req.method === 'GET') {
    const story = await prisma.story.findUnique({
      where: { id },
      include: { cast: true },
    });
    if (!story) return res.status(404).json({ error: '故事不存在' });
    return res.status(200).json(story);
  }

  if (req.method === 'POST') {
    const story = await prisma.story.findUnique({ where: { id } });
    if (!story) return res.status(404).json({ error: '故事不存在' });

    const body = req.body as { characterIds?: string[] };
    const characterIds = Array.isArray(body?.characterIds) ? body.characterIds : [];

    const clueAnalysis = (story.clue_analysis as ClueAnalysisItem[] | null) || [];
    if (clueAnalysis.length === 0) {
      return res.status(400).json({ error: '暂无线索图分析' });
    }

    let characterInfos: CharacterSummaryForStory[] = [];
    if (characterIds.length > 0) {
      const chars = await prisma.character.findMany({
        where: { id: { in: characterIds } },
        select: { name: true, visual_tags: true },
      });
      characterInfos = chars.map((c) => {
        const vt = c.visual_tags as { summary?: string; labels?: string[] } | null;
        return {
          name: c.name,
          summary: vt?.summary,
          labels: vt?.labels,
        };
      });
    }

    try {
      const { storySummary, themes } = await generateStorySummaryAndThemes(clueAnalysis, characterInfos);
      await prisma.story.update({
        where: { id },
        data: {
          story_summary: storySummary,
          recommended_themes: themes as unknown as object,
        },
      });
      return res.status(200).json({ storySummary, recommendedThemes: themes });
    } catch (e) {
      console.error('story summary error:', e);
      return res.status(500).json({ error: '生成故事概要失败' });
    }
  }

  if (req.method === 'PATCH') {
    const body = req.body as {
      script?: { title?: string; pages?: { text: string; description: string }[] };
      page_characters?: string[][];
      story_summary?: string;
    };
    const story = await prisma.story.findUnique({ where: { id } });
    if (!story) return res.status(404).json({ error: '故事不存在' });

    const data: { script?: object; page_characters?: object; story_summary?: string } = {};
    if (body.script != null) data.script = body.script as object;
    if (body.page_characters != null) data.page_characters = body.page_characters as object;
    if (body.story_summary !== undefined) data.story_summary = body.story_summary;

    const updated = await prisma.story.update({
      where: { id },
      data,
      include: { cast: true },
    });
    return res.status(200).json(updated);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
