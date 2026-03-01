import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { uploadBuffer } from '@/lib/gcs';
import { analyzeBatchFromBuffers } from '@/lib/vision-python';
import { prisma } from '@/lib/prisma';
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

  const payloads = entries.map((e) => ({
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

  // 1. 上传到 GCS
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
      ? `视觉服务异常：${visionResult.error}（请确认 vision-service 已启动，端口 5001）`
      : undefined;

  const clue_analysis: ClueAnalysisItem[] = clue_images.map((url, i) => {
    const detail = visionResult.success && visionResult.data?.details?.[i];
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

  const story = await prisma.story.create({
    data: {
      status: 'draft',
      clue_images,
      clue_analysis: clue_analysis as unknown as object,
    },
  });

  return res.status(200).json({
    storyId: story.id,
    clue_images,
    clue_analysis,
  });
}
