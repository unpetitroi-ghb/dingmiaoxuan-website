/**
 * 上传与存储：仅使用服务器本地目录，不再使用 Google Cloud Storage。
 * 文件写入 public/uploads/，返回可访问的路径 /uploads/xxx。
 */

import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

function ensureUploadsDir(): string {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  return UPLOADS_DIR;
}

function safeFilename(original: string): string {
  const ext = path.extname(original) || '.jpg';
  const base = path.basename(original, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  const unique = `${Date.now()}-${randomBytes(4).toString('hex')}`;
  return `${base}-${unique}${ext}`;
}

/**
 * 将 buffer 保存到本地 public/uploads/，返回可访问路径 /uploads/xxx
 */
export async function uploadBuffer(
  filename: string,
  _contentType: string,
  buffer: Buffer
): Promise<string> {
  const dir = ensureUploadsDir();
  const name = safeFilename(filename);
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${name}`;
}

/**
 * 删除已上传文件（按返回的 publicUrl 路径解析为本地路径后删除）
 */
export async function deleteFile(publicUrl: string): Promise<void> {
  if (!publicUrl.startsWith('/uploads/')) return;
  const name = path.basename(publicUrl);
  const filePath = path.join(UPLOADS_DIR, name);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * 本地存储不支持签名直传，仅返回一个占位 publicUrl；实际上传请使用 POST /api/upload-file。
 */
export async function generateUploadSignedUrl(
  filename: string,
  contentType: string
): Promise<{ signedUrl: string; publicUrl: string }> {
  const name = safeFilename(filename);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  return {
    signedUrl: '',
    publicUrl: baseUrl ? `${baseUrl.replace(/\/$/, '')}/uploads/${name}` : `/uploads/${name}`,
  };
}
