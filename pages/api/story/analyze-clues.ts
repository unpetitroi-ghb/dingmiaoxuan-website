import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { uploadBuffer } from '@/lib/gcs';
import { analyzeBatchFromBuffers } from '@/lib/vision-python';
import { normalizeImageToJpeg } from '@/lib/image-utils';
import { prisma } from '@/lib/prisma';
import {
  getGuestIdFromCookie,
  createNewGuestId,
  getSetCookieHeader,
  FREE_STORY_LIMIT,
} from '@/lib/quota';
import type { ClueAnalysisItem } from '@/lib/deepseek';

export const config = {
  api: { bodyParser: false },
};

function normalizeFiles(files: formidable.Files): { filepath: string; originalFilename: string; mimetype: string }[] {
  const raw =
    (files as Record<string, unknown>).images ??
    (files as Record<string, unknown>)['images[]'] ??
    (files as Record<string, unknown>).image;
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list
    .filter((f): f is { filepath: string; originalFilename?: string; mimetype?: string } => Boolean(f && typeof (f as { filepath?: string }).filepath === 'string'))
    .map((f) => ({
      filepath: f.filepath,
      originalFilename: f.originalFilename || 'image.jpg',
      mimetype: f.mimetype || 'image/jpeg',
    }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({ maxFiles: 20, maxFileSize: 15 * 1024 * 1024 });
  let entries: { filepath: string; originalFilename: string; mimetype: string }[] = [];

  try {
    const [, , files] = await new Promise<[unknown, unknown, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, fields, files]);
      });
    });
    entries = normalizeFiles(files);
  } catch (e) {
    console.error('story/analyze-clues parse error:', e);
    return res.status(400).json({ error: '解析上传失败' });
  }

  if (entries.length === 0) {
    return res.status(400).json({ error: '请上传至少一张线索图（字段名 images）' });
  }

  // 免费额度：按 guest_id 统计已创作本数，超出则 402 付费墙
  let guestId = getGuestIdFromCookie(req.headers.cookie);
  const isNewGuest = !guestId;
  if (isNewGuest) guestId = createNewGuestId();

  const used = await prisma.story.count({ where: { guestId } });
  if (used >= FREE_STORY_LIMIT) {
    return res.status(402).json({
      code: 'QUOTA_EXCEEDED',
      message: '您已用完免费额度，继续创作请解锁',
      used,
      limit: FREE_STORY_LIMIT,
    });
  }

  const rawPayloads = entries.map((e) => ({
    buffer: fs.readFileSync(e.filepath),
    filename: e.originalFilename,
    contentType: e.mimetype,
  }));

  for (const e of entries) {
    try {
      fs.unlinkSync(e.filepath);
    } catch {
      // ignore
    }
  }

  const payloads = await Promise.all(
    rawPayloads.map((p) => normalizeImageToJpeg(p.buffer, p.contentType, p.filename))
  );

  // 1. 上传到本地（已统一为 JPEG）
  const clue_images: string[] = [];
  for (const p of payloads) {
    const url = await uploadBuffer(p.filename, p.contentType || 'image/jpeg', p.buffer);
    clue_images.push(url);
  }

  // 2. 一次批量调用视觉服务，拿到每张图的独立分析
  const visionResult = await analyzeBatchFromBuffers(
    payloads.map((p) => ({ buffer: p.buffer, filename: p.filename, contentType: p.contentType }))
  );

  const visionFailedMessage =
    !visionResult.success && visionResult.error
      ? `视觉分析异常：${visionResult.error}（请检查 HUNYUAN_API_KEY 配置）`
      : undefined;

  const clue_analysis: ClueAnalysisItem[] = clue_images.map((url, i) => {
    const detail = visionResult.success ? visionResult.data?.details?.[i] : undefined;
    const perImageSummary = detail?.summary ?? visionResult.data?.summaries?.[i];
    return {
      url,
      summary:
        perImageSummary ??
        (visionResult.success && visionResult.data ? visionResult.data.summary : undefined) ??
        visionFailedMessage,
      labels: visionResult.success && visionResult.data ? visionResult.data.all_labels : undefined,
    };
  });

  const ensuredGuestId = guestId as string;

  const story = await prisma.story.create({
    data: {
      status: 'draft',
      guestId: ensuredGuestId,
      clue_images,
      clue_analysis: clue_analysis as unknown as object,
    },
  });

  const headers: Record<string, string> = {};
  if (isNewGuest) headers['Set-Cookie'] = getSetCookieHeader(ensuredGuestId);

  if (Object.keys(headers).length > 0) {
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  }

  return res.status(200).json({
    storyId: story.id,
    clue_images,
    clue_analysis,
  });
}
