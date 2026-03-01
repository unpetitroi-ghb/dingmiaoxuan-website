import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const list = await prisma.character.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return res.status(200).json(list);
  } catch (error) {
    console.error('characters list error:', error);
    return res.status(500).json({ error: '获取角色列表失败' });
  }
}
