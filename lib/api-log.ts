import { prisma } from '@/lib/prisma';

export async function logApiCall(service: 'deepseek' | 'jimeng' | 'vision', opts?: { storyId?: string; guestId?: string }): Promise<void> {
  try {
    await prisma.apiCall.create({
      data: {
        service,
        storyId: opts?.storyId ?? null,
        guestId: opts?.guestId ?? null,
      },
    });
  } catch (e) {
    console.error('[api-log]', e);
  }
}
