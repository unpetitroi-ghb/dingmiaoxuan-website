/**
 * 内存任务队列 + 绘本文件存储
 * MVP 阶段：单台服务器，内存存 job 状态，JSON 存绘本数据
 */
import fs from 'fs';
import path from 'path';

// ── 类型定义 ──────────────────────────────────────────────────────────────────

export interface BookPage {
  index: number;
  text: string;
  description: string;
  imageUrl: string;
}

export interface Book {
  id: string;
  title: string;
  characterName: string;
  characterLabel: string;
  style: string;
  pages: BookPage[];
  createdAt: string;
  characterPhotoUrl?: string;
}

export type JobEvent =
  | { type: 'progress'; stage: string; percent: number }
  | { type: 'script'; title: string; totalPages: number }
  | { type: 'page'; index: number; text: string; imageUrl: string }
  | { type: 'done'; bookId: string }
  | { type: 'error'; message: string };

interface Job {
  id: string;
  status: 'running' | 'done' | 'error';
  events: JobEvent[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribers: Set<any>;
}

// ── 内存存储 ──────────────────────────────────────────────────────────────────

const jobs = new Map<string, Job>();

export function createJob(id: string): Job {
  const job: Job = { id, status: 'running', events: [], subscribers: new Set() };
  jobs.set(id, job);
  // 30 分钟后自动清理
  setTimeout(() => jobs.delete(id), 30 * 60 * 1000);
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function subscribeJob(id: string, res: any): boolean {
  const job = jobs.get(id);
  if (!job) return false;
  job.subscribers.add(res);
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function unsubscribeJob(id: string, res: any) {
  jobs.get(id)?.subscribers.delete(res);
}

export function pushEvent(jobId: string, event: JobEvent) {
  const job = jobs.get(jobId);
  if (!job) return;
  job.events.push(event);
  const line = `data: ${JSON.stringify(event)}\n\n`;
  for (const sub of job.subscribers) {
    try { sub.write(line); } catch { /* subscriber gone */ }
  }
  if (event.type === 'done' || event.type === 'error') {
    job.status = event.type === 'done' ? 'done' : 'error';
    // 延迟关闭，让客户端收到最后事件
    setTimeout(() => {
      for (const sub of job.subscribers) {
        try { sub.end(); } catch { /* ignore */ }
      }
      job.subscribers.clear();
    }, 500);
  }
}

// ── 绘本文件存储 ──────────────────────────────────────────────────────────────

const BOOKS_DIR = path.join(process.cwd(), 'data', 'books');

function ensureBooksDir() {
  if (!fs.existsSync(BOOKS_DIR)) fs.mkdirSync(BOOKS_DIR, { recursive: true });
}

export function saveBook(book: Book): void {
  ensureBooksDir();
  fs.writeFileSync(path.join(BOOKS_DIR, `${book.id}.json`), JSON.stringify(book, null, 2));
}

export function loadBook(id: string): Book | null {
  const filePath = path.join(BOOKS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Book;
  } catch {
    return null;
  }
}
