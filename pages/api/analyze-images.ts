import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { analyzeBatchFromBuffers } from '@/lib/vision-python';

export const config = {
  api: { bodyParser: false },
};

function normalizeFiles(files: formidable.Files): { filepath: string; originalFilename: string; mimetype: string }[] {
  const key = 'images[]';
  const raw = files[key] ?? (files as Record<string, unknown>).images;
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

  const form = formidable({ maxFiles: 5, maxFileSize: 10 * 1024 * 1024 });
  let entries: { filepath: string; originalFilename: string; mimetype: string }[] = [];

  try {
    const [_, __, files] = await new Promise<[unknown, unknown, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, fields, files]);
      });
    });
    entries = normalizeFiles(files);
  } catch (e) {
    console.error('analyze-images parse error:', e);
    return res.status(400).json({ error: '解析上传文件失败' });
  }

  if (entries.length === 0) {
    return res.status(400).json({ error: '请上传至少一张图片（字段名 images[]）' });
  }

  const payloads = entries.map((e) => ({
    buffer: fs.readFileSync(e.filepath),
    filename: e.originalFilename,
    contentType: e.mimetype,
  }));

  // 清理临时文件
  for (const e of entries) {
    try {
      fs.unlinkSync(e.filepath);
    } catch {
      // ignore
    }
  }

  const result = await analyzeBatchFromBuffers(payloads);

  if (!result.success || !result.data) {
    console.error('analyze-images vision service error:', result.error);
    return res.status(503).json({
      error: 'VISION_SERVICE_UNAVAILABLE',
      message: '万物识别服务未启动或不可用，请先启动 vision-service（见项目 vision-service 目录）。',
    });
  }

  return res.status(200).json({
    summary: result.data.summary,
    all_labels: result.data.all_labels || [],
    description: result.data.summary,
  });
}
