import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminSessionFromRequest, verifyAdminSession } from '@/lib/admin-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const token = getAdminSessionFromRequest(req);
  if (!verifyAdminSession(token)) {
    return res.status(401).json({ error: '未登录' });
  }
  return res.status(200).json({ ok: true });
}
