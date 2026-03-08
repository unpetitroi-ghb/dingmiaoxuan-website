import { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdmin(req, res)) return;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [storiesTotal, charactersTotal, storiesLast7Days, apiCallsGrouped] = await Promise.all([
    prisma.story.count(),
    prisma.character.count(),
    prisma.story.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.apiCall.groupBy({
      by: ['service'],
      _count: { id: true },
      where: { createdAt: { gte: sevenDaysAgo } },
    }).then((r) => r).catch(() => [] as { service: string; _count: { id: number } }[]),
  ]);

  const apiCallsLast7Days: Record<string, number> = {};
  for (const g of apiCallsGrouped) {
    apiCallsLast7Days[g.service] = g._count.id;
  }

  return res.status(200).json({
    storiesTotal,
    charactersTotal,
    storiesLast7Days,
    apiCallsLast7Days,
  });
}
