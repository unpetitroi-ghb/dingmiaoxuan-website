/**
 * Generate-script API: adapter for DeepSeek (or configured LLM).
 * - Never assume model output is valid JSON; parse defensively.
 * - Always validate with zod before returning.
 * - Return explicit error codes; do not leak keys or stack traces.
 */
import { NextApiRequest, NextApiResponse } from 'next';
import { generateStructuredScript } from '@/lib/deepseek';
import {
  StoryScriptSchema,
  normalizeScriptPageNumbers,
} from '@/lib/story-schema';
import type { StoryScript } from '@/types/story';

const PAGE_COUNT_DEFAULT = 8;

/** 宽松补全单页缺失字段，便于 zod 通过 */
function normalizePage(p: Record<string, unknown>, index: number): Record<string, unknown> {
  return {
    pageNo: typeof p.pageNo === 'number' ? p.pageNo : index + 1,
    sceneTitle: typeof p.sceneTitle === 'string' ? p.sceneTitle : `第 ${index + 1} 页`,
    imagePrompt: typeof p.imagePrompt === 'string' && p.imagePrompt.trim() ? p.imagePrompt.trim() : (p.description as string) ?? `画面 ${index + 1}`,
    caption: typeof p.caption === 'string' ? p.caption : (p.text as string) ?? '',
    dialogue: typeof p.dialogue === 'string' ? p.dialogue : '',
    visualChecklist: Array.isArray(p.visualChecklist) ? p.visualChecklist : [],
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body as {
    character_description?: string;
    character_name?: string;
    story_idea?: string;
    style?: string;
    pageCount?: number;
  };

  const character_description =
    typeof body?.character_description === 'string'
      ? body.character_description.trim()
      : '';
  const character_name =
    typeof body?.character_name === 'string'
      ? body.character_name.trim()
      : '小主角';
  const story_idea =
    typeof body?.story_idea === 'string' ? body.story_idea.trim() : '';
  const style = typeof body?.style === 'string' ? body.style.trim() : '绘本';
  const pageCount =
    typeof body?.pageCount === 'number' && body.pageCount >= 6 && body.pageCount <= 10
      ? body.pageCount
      : PAGE_COUNT_DEFAULT;

  if (!character_description && !story_idea) {
    return res.status(400).json({
      error: '请提供 character_description 或 story_idea',
    });
  }

  try {
    const rawResult = await generateStructuredScript({
      character_description: character_description || '用户上传了照片，请结合故事创意创作。',
      character_name,
      story_idea,
      style,
      pageCount,
    });

    const rawPages = Array.isArray(rawResult.pages) ? rawResult.pages : [];
    const normalizedPages = normalizeScriptPageNumbers(
      rawPages.map((p, i) => normalizePage(p as unknown as Record<string, unknown>, i))
    );

    const toValidate: Record<string, unknown> = {
      title: rawResult.title ?? '我的绘本',
      theme: rawResult.theme ?? '温馨故事',
      targetAge: rawResult.targetAge ?? '3-8岁',
      style: rawResult.style ?? style,
      characterProfile: rawResult.characterProfile ?? {
        name: character_name,
        coreTraits: [],
        visualConsistency: character_description || '主角',
      },
      pages: normalizedPages,
    };

    const parsed = StoryScriptSchema.safeParse(toValidate);
    if (!parsed.success) {
      console.warn('generate-script zod validation failed', parsed.error.flatten());
      return res.status(502).json({
        error: 'SCRIPT_VALIDATION_FAILED',
        message: '模型返回的脚本格式不符合要求，请重试。',
      });
    }

    const script: StoryScript = parsed.data as StoryScript;
    return res.status(200).json(script);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('generate-script error:', e);
    return res.status(503).json({
      error: 'GENERATE_SCRIPT_FAILED',
      message: msg,
    });
  }
}
