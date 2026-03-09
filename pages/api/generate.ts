/**
 * POST /api/generate
 * 启动绘本生成任务，立即返回 jobId
 * 实际生成在后台异步进行，进度通过 /api/stream/[jobId] 的 SSE 推送
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { createJob, pushEvent, saveBook } from '@/lib/jobs';
import { generateBookScript } from '@/lib/deepseek';
import { generateImage } from '@/lib/jimeng';

export interface GeneratePayload {
  characterName: string;
  characterLabel: string;
  characterDescription: string;
  characterPhotoUrl?: string;
  sceneAnalysis: {
    scenes: string[];
    activities: string[];
    mood: string;
    summary: string;
  };
  storyTheme: string;
  educationalTheme?: string;
  style: string;
  pageCount: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const payload = req.body as GeneratePayload;

  if (!payload.characterName || !payload.sceneAnalysis || !payload.storyTheme) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const jobId = randomUUID();
  const bookId = randomUUID();
  createJob(jobId);

  // 立即返回 jobId，后台异步执行
  res.status(200).json({ jobId, bookId });

  // 异步生成（不 await）
  runGeneration(jobId, bookId, payload).catch(e => {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[job ${jobId}] fatal error:`, msg);
    pushEvent(jobId, { type: 'error', message: msg });
  });
}

async function runGeneration(jobId: string, bookId: string, payload: GeneratePayload) {
  const {
    characterName, characterLabel, characterDescription,
    characterPhotoUrl, sceneAnalysis, storyTheme,
    educationalTheme, style, pageCount,
  } = payload;

  // ── 阶段1：生成脚本 ──────────────────────────────────────────────────────
  pushEvent(jobId, { type: 'progress', stage: '正在编写故事脚本…', percent: 5 });

  const script = await generateBookScript({
    characterName,
    characterLabel,
    characterDescription,
    sceneAnalysis,
    storyTheme,
    educationalTheme,
    style,
    pageCount,
  });

  pushEvent(jobId, {
    type: 'script',
    title: script.title,
    totalPages: script.pages.length,
  });
  pushEvent(jobId, { type: 'progress', stage: '脚本完成，开始绘制插画…', percent: 15 });

  // ── 阶段2：逐页生成插画 ──────────────────────────────────────────────────
  const generatedPages = [];
  const total = script.pages.length;

  for (let i = 0; i < total; i++) {
    const page = script.pages[i];
    const pageNum = i + 1;

    pushEvent(jobId, {
      type: 'progress',
      stage: `正在绘制第 ${pageNum} / ${total} 页插画…`,
      percent: 15 + Math.round((i / total) * 80),
    });

    let imageUrl = '';
    try {
      imageUrl = await generateImage({
        description: page.description,
        characterDescription,
        characterName,
        style,
        referenceImageUrl: characterPhotoUrl,
      });
    } catch (imgErr) {
      console.warn(`[job ${jobId}] 第${pageNum}页插画失败:`, imgErr);
      imageUrl = ''; // 允许失败，展示占位图
    }

    const bookPage = { index: i, text: page.text, description: page.description, imageUrl };
    generatedPages.push(bookPage);

    pushEvent(jobId, { type: 'page', index: i, text: page.text, imageUrl });
  }

  // ── 阶段3：保存绘本 ──────────────────────────────────────────────────────
  pushEvent(jobId, { type: 'progress', stage: '正在整理绘本…', percent: 98 });

  const book = {
    id: bookId,
    title: script.title,
    characterName,
    characterLabel,
    style,
    pages: generatedPages,
    createdAt: new Date().toISOString(),
    characterPhotoUrl,
  };

  saveBook(book);

  pushEvent(jobId, { type: 'done', bookId });
}
