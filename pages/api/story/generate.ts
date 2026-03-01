import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { generateScriptForStory } from '@/lib/deepseek';
import type { ClueAnalysisItem } from '@/lib/deepseek';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body as { storyId: string; selected_theme: string; characterIds?: string[]; story_summary?: string };

  if (!body.storyId || !body.selected_theme) {
    return res.status(400).json({ error: '缺少 storyId 或 selected_theme' });
  }

  const story = await prisma.story.findUnique({
    where: { id: body.storyId },
    include: { cast: true },
  });

  if (!story) {
    return res.status(404).json({ error: '故事不存在' });
  }

  if (story.status !== 'draft') {
    return res.status(400).json({ error: '该故事已生成过脚本' });
  }

  const clue_analysis = (story.clue_analysis as ClueAnalysisItem[] | null) || [];
  const recommended_themes = (story.recommended_themes as { title: string; summary: string; moral_lesson?: string }[] | null) || [];
  const selected = recommended_themes.find((t) => t.title === body.selected_theme) || recommended_themes[0];
  const moral_lesson = selected?.moral_lesson ?? undefined;

  let characterNames: string[] = story.cast.map((c) => c.name);
  if (Array.isArray(body.characterIds) && body.characterIds.length > 0) {
    const chars = await prisma.character.findMany({
      where: { id: { in: body.characterIds } },
      select: { name: true },
    });
    characterNames = chars.map((c) => c.name);
    await prisma.story.update({
      where: { id: body.storyId },
      data: {
        status: 'generating',
        selected_theme: body.selected_theme,
        moral_lesson: moral_lesson || null,
        cast: { set: body.characterIds.map((id) => ({ id })) },
      },
    });
  } else {
    await prisma.story.update({
      where: { id: body.storyId },
      data: {
        status: 'generating',
        selected_theme: body.selected_theme,
        moral_lesson: moral_lesson || null,
      },
    });
  }

  const storySummary = body.story_summary ?? story.story_summary ?? undefined;

  try {
    const scriptResult = await generateScriptForStory({
      clueAnalysis: clue_analysis,
      selectedTheme: body.selected_theme,
      moral_lesson,
      characterNames: characterNames.length > 0 ? characterNames : ['主角'],
      storySummary,
    });

    await prisma.story.update({
      where: { id: body.storyId },
      data: {
        status: 'completed',
        title: scriptResult.title,
        script: scriptResult as unknown as object,
      },
    });

    const updated = await prisma.story.findUnique({
      where: { id: body.storyId },
      include: { cast: true },
    });

    return res.status(200).json(updated);
  } catch (e) {
    console.error('story/generate script error:', e);
    await prisma.story.update({
      where: { id: body.storyId },
      data: { status: 'draft' },
    });
    return res.status(500).json({ error: '生成脚本失败' });
  }
}
