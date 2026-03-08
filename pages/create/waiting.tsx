'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

const HINTS = [
  '魔法画笔正在准备...',
  '召唤角色中...',
  '混合魔法颜料...',
  '描绘星空...',
  '添加闪闪发光...',
];

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
          style={{
            background: 'linear-gradient(to top, var(--kid-magic), var(--kid-primary))',
          }}
          initial={{ height: '0%' }}
          animate={{ height: `${Math.min(100, progress)}%` }}
          transition={{ duration: 0.5 }}
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

export default function WaitingPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [hint, setHint] = useState(HINTS[0]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem('createPayload') : null;
    if (!raw) {
      router.replace('/create');
      return;
    }
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHint(HINTS[Math.floor(Math.random() * HINTS.length)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleClickFairy = useCallback(() => {
    setProgress((p) => {
      const next = Math.min(100, p + 5);
      if (next >= 100) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        setDone(true);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    progressIntervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          setDone(true);
          return 100;
        }
        return p + 4;
      });
    }, 800);
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!done) return;
    const mockFullStory = {
      title: '我的绘本',
      pages: [
        { index: 0, text: '（生成完成，此处为示例页）', imageUrl: '/hero-image.jpg' },
      ],
    };
    sessionStorage.setItem('fullStory', JSON.stringify(mockFullStory));
    router.replace('/create/preview');
  }, [done, router]);

  return (
    <div className="kid-page min-h-screen flex flex-col items-center justify-center relative">
      <h1 className="kid-title text-xl sm:text-2xl mb-6 text-center">
        正在施展魔法...
      </h1>

      <div className="relative">
        <MagicBottle progress={progress} />

        <motion.div
          whileTap={{ scale: 1.2 }}
          onClick={handleClickFairy}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 text-5xl sm:text-6xl cursor-pointer select-none"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(139,92,246,0.3))' }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleClickFairy()}
          aria-label="点击小精灵加速"
        >
          🧚‍♀️
        </motion.div>
      </div>

      <p className="kid-muted text-center mt-6 min-h-[1.5em]">
        {hint}
      </p>

      {error && (
        <p className="text-[var(--kid-error)] text-sm mt-4 text-center">
          {error}
        </p>
      )}

      <p className="kid-muted text-sm mt-4">
        {progress}%
      </p>

      <a
        href="/create"
        className="kid-btn-secondary mt-8"
      >
        返回重试
      </a>
    </div>
  );
}
