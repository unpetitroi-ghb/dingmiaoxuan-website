/**
 * GET /api/stream/[jobId]
 * SSE 长连接，实时推送绘本生成进度
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getJob, subscribeJob, unsubscribeJob } from '@/lib/jobs';

export const config = { api: { bodyParser: false } };

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { jobId } = req.query as { jobId: string };
  const job = getJob(jobId);

  if (!job) {
    res.status(404).json({ error: '任务不存在' });
    return;
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // 关闭 nginx 缓冲
  res.flushHeaders();

  // 如果任务已完成，把历史事件全部发送后关闭
  if (job.status === 'done' || job.status === 'error') {
    for (const event of job.events) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
    res.end();
    return;
  }

  // 发送已有历史事件（客户端重连时补齐）
  for (const event of job.events) {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  // 注册订阅
  subscribeJob(jobId, res);

  // 心跳保活（每 20s 发一次注释行，防止代理超时断连）
  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { clearInterval(heartbeat); }
  }, 20_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribeJob(jobId, res);
  });
}
