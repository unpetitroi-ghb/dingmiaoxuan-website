'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

// ── 阶段定义 ──────────────────────────────────────────────────────────────────
const PHASES = [
  { key: 'script',  label: '✍️ 正在编写故事脚本…' },
  { key: 'images',  label: '🎨 正在绘制插画…'      },
  { key: 'done',    label: '✨ 绘本生成完成！'       },
];

const HINTS = [
  '魔法画笔正在准备…',
  '召唤故事精灵中…',
  '混合魔法颜料…',
  '描绘星空与彩虹…',
  '添加闪闪发光效果…',
  '故事情节正在展开…',
];

// ── 魔法瓶 UI ─────────────────────────────────────────────────────────────────
function MagicBottle({ progress }: { progress: number }) {
  return (
    <div className="relative w-48 h-64 mx-auto">
      <div
        className="absolute inset-0 rounded-b-full rounded-t-3xl border-4 overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)',
          borderColor: 'var(--kid-magic-light)',
          boxShadow: 'var(--kid-shadow-magic)',
        }}
      >
        <motion.div
          className="absolute bottom-0 left-0 right-0"
          style={{ background: 'linear-gradient(to top, var(--kid-magic), var(--kid-primary))' }}
          initial={{ height: '0%' }}
          animate={{ height: `${Math.min(100, progress)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/60 rounded-full"
            animate={{ y: [0, -50], opacity: [0, 1, 0] }}
            transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
            style={{ left: `${20 + i * 15}%`, bottom: '10%' }}
          />
        ))}
      </div>
      <div
        className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-16 h-8 rounded-t-lg"
        style={{ backgroundColor: 'var(--kid-magic-dark)' }}
      />
    </div>
  );
}

// ── 主页面 ────────────────────────────────────────────────────────────────────
export default function WaitingPage() {
  const router = useRouter();
  const [progress, setProgress]     = useState(0);
  const [phaseIdx, setPhaseIdx]     = useState(0);
  const [hint, setHint]             = useState(HINTS[0]);
  const [error, setError]           = useState<string | null>(null);
  const [pagesDone, setPagesDone]   = useState(0);
  const [totalPages, setTotalPages] = useState(6);
  const hasRun = useRef(false);

  // 轮换 hint 文案
  useEffect(() => {
    const t = setInterval(() => {
      setHint(HINTS[Math.floor(Math.random() * HINTS.length)]);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  // ── 核心生成流水线 ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const raw = typeof window !== 'undefined'
      ? sessionStorage.getItem('createPayload')
      : null;

    if (!raw) {
      router.replace('/create');
      return;
    }

    const payload = JSON.parse(raw) as {
      photoUrls: string[];
      analysisResult: { summary: string; all_labels: string[] } | null;
      imageLabels: string[];
      characterName: string;
      storyIdea: string;
      style: string;
      projectId: string;
    };

    void runPipeline(payload);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runPipeline(payload: {
    photoUrls: string[];
    analysisResult: { summary: string; all_labels: string[] } | null;
    imageLabels: string[];
    characterName: string;
    storyIdea: string;
    style: string;
    projectId: string;
  }) {
    try {
      // ── 阶段 1：生成故事脚本 (DeepSeek) ──────────────────────────────────
      setPhaseIdx(0);
      setProgress(5);

      const storyBody: Record<string, unknown> = {
        characterName: payload.characterName,
        userStoryIdea: payload.storyIdea,
        style: payload.style,
        pageCount: 6,
      };
      if (payload.analysisResult) {
        storyBody.imageAnalysis = {
          summary: payload.analysisResult.summary,
          labels: payload.imageLabels ?? payload.analysisResult.all_labels ?? [],
        };
      }

      const storyRes = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storyBody),
      });

      if (!storyRes.ok) {
        const errData = await storyRes.json().catch(() => ({})) as { message?: string };
        throw new Error(errData.message ?? `故事生成失败 (${storyRes.status})`);
      }

      const script = await storyRes.json() as {
        title: string;
        pages: { text: string; description: string }[];
      };

      const pages = script.pages ?? [];
      setTotalPages(pages.length || 6);
      setProgress(20);

      // ── 阶段 2：逐页生成插画 (即梦 4.0) ──────────────────────────────────
      setPhaseIdx(1);

      const referenceImageUrl = payload.photoUrls?.[0] ?? undefined;
      const generatedPages: { index: number; text: string; imageUrl: string }[] = [];

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const prompt = `${page.description}，主角是${payload.characterName}`;

        let imageUrl = '';
        try {
          const imgRes = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, style: payload.style, referenceImageUrl }),
          });

          if (imgRes.ok) {
            const imgData = await imgRes.json() as { imageUrl?: string };
            imageUrl = imgData.imageUrl ?? '';
          } else {
            console.warn(`第 ${i + 1} 页插画生成失败，跳过`);
          }
        } catch (imgErr) {
          console.warn(`第 ${i + 1} 页插画请求异常：`, imgErr);
        }

        generatedPages.push({ index: i, text: page.text, imageUrl });
        setPagesDone(i + 1);

        // 进度 20% → 95%，按页平分
        const imgProgress = 20 + Math.round(((i + 1) / pages.length) * 75);
        setProgress(imgProgress);
      }

      // ── 阶段 3：完成 ──────────────────────────────────────────────────────
      setPhaseIdx(2);
      setProgress(100);

      sessionStorage.setItem('fullStory', JSON.stringify({
        title: script.title ?? '我的绘本',
        pages: generatedPages,
      }));

      await new Promise((r) => setTimeout(r, 1200));
      router.replace('/create/preview');

    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    }
  }

  const phase = PHASES[Math.min(phaseIdx, PHASES.length - 1)];

  return (
    <div className="kid-page min-h-screen flex flex-col items-center justify-center relative">
      <h1 className="kid-title text-xl sm:text-2xl mb-4 text-center">
        正在施展魔法…
      </h1>

      {/* 当前阶段 */}
      <p className="text-[var(--kid-magic-dark)] font-semibold text-base mb-6 text-center min-h-[1.5em]">
        {phase?.label}
      </p>

      {/* 魔法瓶 */}
      <MagicBottle progress={progress} />

      {/* 进度数字 */}
      <p className="kid-muted text-sm mt-4">{progress}%</p>

      {/* 插画页数进度（阶段2时显示） */}
      {phaseIdx === 1 && (
        <p className="kid-muted text-sm mt-1">
          已完成插画 {pagesDone} / {totalPages} 页
        </p>
      )}

      {/* 随机提示文案 */}
      <p className="kid-muted text-center mt-3 min-h-[1.5em] text-sm">{hint}</p>

      {/* 错误提示 */}
      {error && (
        <div className="mt-6 kid-card p-4 max-w-sm text-center space-y-3">
          <p className="text-[var(--kid-error)] text-sm">{error}</p>
          <a href="/create" className="kid-btn-secondary block">
            返回重试
          </a>
        </div>
      )}

      {!error && (
        <a
          href="/create"
          className="mt-8 text-xs kid-muted underline underline-offset-2 opacity-50 hover:opacity-80"
        >
          取消，返回重新创作
        </a>
      )}
    </div>
  );
}
