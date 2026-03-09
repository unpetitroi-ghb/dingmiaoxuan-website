/**
 * POST /api/upload
 * 接收 multipart/form-data 中的 images[]，保存到 public/uploads/，返回 URL 列表
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export const config = { api: { bodyParser: false } };

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

function ensureDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  ensureDir();

  const form = formidable({
    uploadDir: UPLOAD_DIR,
    keepExtensions: true,
    maxFiles: 20,
    maxFileSize: 15 * 1024 * 1024, // 15MB per file
    maxTotalFileSize: 100 * 1024 * 1024,
  });

  try {
    const [, files] = await form.parse(req);
    const uploaded = (files['images[]'] ?? files['images'] ?? []).flat();

    if (uploaded.length === 0) {
      return res.status(400).json({ error: '未收到图片文件' });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:3000`;
    const urls: string[] = [];

    for (const file of uploaded) {
      const ext = path.extname(file.originalFilename ?? '.jpg') || '.jpg';
      const newName = `${randomUUID()}${ext}`;
      const newPath = path.join(UPLOAD_DIR, newName);
      fs.renameSync(file.filepath, newPath);
      urls.push(`${appUrl}/uploads/${newName}`);
    }

    return res.status(200).json({ urls });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('upload error:', msg);
    return res.status(500).json({ error: `上传失败: ${msg}` });
  }
}
