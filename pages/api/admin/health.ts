import { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/admin-auth';
import { checkVisionService } from '@/lib/vision-python';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdmin(req, res)) return;

  let vision = false;
  let database = false;

  try {
    vision = await checkVisionService();
  } catch {
    vision = false;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
  } catch {
    database = false;
  }

  return res.status(200).json({ vision, database });
}
