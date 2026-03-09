/**
 * GET /api/book/[id]
 * 获取已生成的绘本数据
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { loadBook } from '@/lib/jobs';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { id } = req.query as { id: string };
  const book = loadBook(id);

  if (!book) return res.status(404).json({ error: '绘本不存在' });
  return res.status(200).json(book);
}
