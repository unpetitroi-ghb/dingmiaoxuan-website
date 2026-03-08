import { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/admin-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdmin(req, res)) return;

  const name = (req.query.name as string) || (req.body as { name?: string })?.name;
  if (name !== 'vision') {
    return res.status(400).json({ error: '仅支持 name=vision' });
  }

  // 视觉分析已改为腾讯混元，无本地 vision 服务，无需重启
  return res.status(200).json({
    ok: true,
    message: '视觉分析使用腾讯混元，无本地服务需重启',
  });
}
