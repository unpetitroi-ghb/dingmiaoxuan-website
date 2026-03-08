import { NextApiRequest, NextApiResponse } from 'next';

const COOKIE_NAME = 'admin_session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
  return res.status(200).json({ ok: true });
}
