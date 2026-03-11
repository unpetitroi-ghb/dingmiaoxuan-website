/**
 * POST /api/upload
 * 接收 multipart/form-data 中的 images[]，保存到 public/uploads/，返回 URL 列表
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import Busboy from 'busboy';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export const config = { api: { bodyParser: false } };

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

function ensureDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  ensureDir();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const urls: string[] = [];
  const writePromises: Promise<void>[] = [];

  let busboy: ReturnType<typeof Busboy>;
  try {
    busboy = Busboy({ headers: req.headers });
  } catch (e) {
    return res.status(400).json({ error: '无效的请求格式' });
  }

  busboy.on('file', (_field, file, info) => {
    const ext = path.extname(info.filename || '.jpg') || '.jpg';
    const newName = `${randomUUID()}${ext}`;
    const newPath = path.join(UPLOAD_DIR, newName);
    const ws = fs.createWriteStream(newPath);
    file.pipe(ws);
    writePromises.push(
      new Promise<void>((resolve, reject) => {
        ws.on('finish', () => { urls.push(`${appUrl}/uploads/${newName}`); resolve(); });
        ws.on('error', reject);
        file.on('error', reject);
      })
    );
  });

  busboy.on('finish', () => {
    Promise.all(writePromises)
      .then(() => {
        if (urls.length === 0) return res.status(400).json({ error: '未收到图片文件' });
        return res.status(200).json({ urls });
      })
      .catch(e => {
        console.error('upload error:', e instanceof Error ? e.message : e);
        res.status(500).json({ error: '上传失败，请重试' });
      });
  });

  busboy.on('error', (e) => {
    console.error('upload error:', e instanceof Error ? e.message : e);
    res.status(500).json({ error: '上传失败，请重试' });
  });

  req.pipe(busboy);
}
