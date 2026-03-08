import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import {
  getGuestIdFromCookie,
  createNewGuestId,
  getSetCookieHeader,
  FREE_STORY_LIMIT,
} from '@/lib/quota';

/**
 * 查询当前访客的免费额度使用情况（前端用于展示「已用 1/1」或提前展示付费墙）
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let guestId = getGuestIdFromCookie(req.headers.cookie);
  const isNewGuest = !guestId;
  if (isNewGuest) {
    guestId = createNewGuestId();
  }
  const ensuredGuestId = guestId as string;

  const used = await prisma.story.count({ where: { guestId: ensuredGuestId } });
  const allowed = used < FREE_STORY_LIMIT;

  if (isNewGuest) {
    res.setHeader('Set-Cookie', getSetCookieHeader(ensuredGuestId));
  }

  return res.status(200).json({
    allowed,
    used,
    limit: FREE_STORY_LIMIT,
  });
}
