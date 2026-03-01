import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { analyzeBatchFromBuffers } from '@/lib/vision-python';

export const config = {
  api: { bodyParser: false },
};

function getFirstFile(files: formidable.Files): { filepath: string; originalFilename: string; mimetype: string } | null {
  const key = 'image';
  const raw = files[key] ?? (files as Record<string, unknown>).image;
  if (!raw) return null;
  const file = Array.isArray(raw) ? raw[0] : raw;
  if (!file || typeof (file as { filepath?: string }).filepath !== 'string') return null;
  return {
    filepath: (file as { filepath: string }).filepath,
    originalFilename: (file as { originalFilename?: string }).originalFilename || 'image.jpg',
    mimetype: (file as { mimetype?: string }).mimetype || 'image/jpeg',
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({ maxFiles: 1, maxFileSize: 10 * 1024 * 1024 });
  let entry: { filepath: string; originalFilename: string; mimetype: string } | null = null;

  try {
    const [, , files] = await new Promise<[unknown, unknown, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, fields, files]);
      });
    });
    entry = getFirstFile(files);
  } catch (e) {
    console.error('character/analyze parse error:', e);
    return res.status(400).json({ error: '解析上传文件失败' });
  }

  if (!entry) {
    return res.status(400).json({ error: '请上传一张图片（字段名 image）' });
  }

  const buffer = fs.readFileSync(entry.filepath);
  try {
    fs.unlinkSync(entry.filepath);
  } catch {
    // ignore
  }

  const result = await analyzeBatchFromBuffers(
    [{ buffer, filename: entry.originalFilename, contentType: entry.mimetype }],
    { context: 'avatar' }
  );

  if (!result.success || !result.data) {
    console.error('character/analyze vision error:', result.error);
    return res.status(503).json({
      error: 'VISION_SERVICE_UNAVAILABLE',
      message: '视觉服务不可用，请先启动 vision-service。',
    });
  }

  // 单图时优先用本图分析摘要（本地 Python 模型结果）
  const firstDetail = result.data.details?.[0];
  const summary = firstDetail?.summary ?? result.data.summary;
  const labels = (firstDetail?.labels?.map((x) => x.label) ?? result.data.all_labels) || [];

  return res.status(200).json({
    summary,
    labels,
    details: result.data.details,
  });
}
