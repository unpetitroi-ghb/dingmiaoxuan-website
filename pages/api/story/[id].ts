/**
 * GET  /api/story/[id]   — 获取故事详情（含脚本与图片）
 * PATCH /api/story/[id]  — 更新故事字段（脚本、状态、图片等）
 */
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: '无效的 story id' });
  }

  if (req.method === 'GET') {
    try {
      const story = await prisma.story.findUnique({ where: { id } });
      if (!story) return res.status(404).json({ error: '故事不存在' });
      return res.status(200).json(story);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return res.status(500).json({ error: msg });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const body = req.body as Record<string, unknown>;
      const updated = await prisma.story.update({
        where: { id },
        data: {
          ...(body.status !== undefined   && { status: body.status as 'draft' | 'generating' | 'completed' }),
          ...(body.title  !== undefined   && { title: body.title as string }),
          ...(body.script !== undefined   && { script: body.script as object }),
          ...(body.selected_theme !== undefined && { selected_theme: body.selected_theme as string }),
          ...(body.moral_lesson   !== undefined && { moral_lesson: body.moral_lesson as string }),
          ...(body.story_summary  !== undefined && { story_summary: body.story_summary as string }),
        },
      });
      return res.status(200).json(updated);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return res.status(500).json({ error: msg });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
