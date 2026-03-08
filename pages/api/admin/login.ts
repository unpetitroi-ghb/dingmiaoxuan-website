import { NextApiRequest, NextApiResponse } from 'next';
import { checkPassword, createAdminSession, setAdminSessionCookie } from '@/lib/admin-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const body = (req.body || {}) as { password?: string };
  const password = typeof body.password === 'string' ? body.password : '';
  if (!checkPassword(password)) {
    return res.status(401).json({ error: '密码错误' });
  }
  const token = createAdminSession();
  setAdminSessionCookie(res, token);
  return res.status(200).json({ ok: true });
}
