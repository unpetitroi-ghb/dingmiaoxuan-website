import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as {
      name: string;
      relationship?: string;
      gender?: string;
      age_range?: string;
      visual_tags?: unknown;
      avatar_url?: string;
      reference_image_url?: string;
      userId?: string;
    };

    if (!body.name || typeof body.name !== 'string') {
      return res.status(400).json({ error: '缺少 name' });
    }

    const character = await prisma.character.create({
      data: {
        name: body.name.trim(),
        relationship: body.relationship?.trim() || null,
        gender: body.gender?.trim() || null,
        age_range: body.age_range?.trim() || null,
        visual_tags: body.visual_tags ?? undefined,
        avatar_url: body.avatar_url?.trim() || null,
        reference_image_url: body.reference_image_url?.trim() || body.avatar_url?.trim() || null,
        userId: body.userId?.trim() || null,
      },
    });

    return res.status(200).json(character);
  } catch (error) {
    console.error('character/create error:', error);
    return res.status(500).json({ error: '创建角色失败' });
  }
}
