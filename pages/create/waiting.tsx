'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

interface ScriptPage {
  text: string;
  description: string;
}

interface StoryFromApi {
  id: string;
  title: string | null;
  script: { title?: string; pages?: ScriptPage[] } | null;
  cast: { id: string; reference_image_url: string | null }[];
  clue_images: string[] | null;
  page_characters?: string[][];
}

export default function WaitingPage() {
  const router = useRouter();
  const [logLines, setLogLines] = useState<string[]>([]);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);

  const appendLog = (msg: string) => {
    setLogLines((prev) => [...prev, msg]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logLines]);

  useEffect(() => {
    const storyId = router.query.storyId as string | undefined;
    const style = (router.query.style as string) || '水彩';

    const generate = async () => {
      try {
        if (!storyId) {
          router.push('/create');
          return;
        }

        appendLog('正在加载你的故事剧本…');

        const { data: story } = await axios.get<StoryFromApi>(`/api/story/${storyId}`);
        const script = story.script;
        if (!script || !Array.isArray(script.pages) || script.pages.length === 0) {
          setErrorMessage('故事脚本为空');
          setIsError(true);
          return;
        }

        appendLog('剧本加载完成！');
        appendLog(`即梦画师开始用「${style}」风格为每一页绘制插画…`);

        const defaultRef =
          story.cast?.[0]?.reference_image_url ||
          (Array.isArray(story.clue_images) && story.clue_images[0]) ||
          '';
        const pageChars = (story.page_characters as string[][] | null) || [];
        const castMap = new Map(story.cast?.map((c) => [c.id, c.reference_image_url]) || []);

        const totalPages = script.pages.length;
        const generatedPages: { index: number; text: string; imageUrl: string }[] = [];

        for (let i = 0; i < totalPages; i++) {
          appendLog(`即梦画师正在绘制第 ${i + 1}/${totalPages} 页…`);

          const pageCharIds = pageChars[i];
          const pageRef = pageCharIds?.map((id) => castMap.get(id)).find((url) => url);
          const referenceImageUrl = pageRef || defaultRef;

          const page = script.pages[i];
          const prompt = `${page.description}，风格：${style}，使用参考图保持形象一致。画面中要留出空白区域（如对话框、横幅或天空）用于添加文字，文字区域保持干净无文字。`;
          const imageRes = await axios.post('/api/generate-image', {
            prompt,
            style,
            referenceImageUrl,
          });
          generatedPages.push({
            index: i,
            text: page.text,
            imageUrl: imageRes.data.imageUrl,
          });
        }

        const fullStory = {
          projectId: story.id,
          title: script.title || story.title || '我的绘本',
          pages: generatedPages,
        };
        sessionStorage.setItem('fullStory', JSON.stringify(fullStory));

        appendLog('全部完成！马上带你去看看～');
        setTimeout(() => router.push('/create/preview'), 1200);
      } catch (error: unknown) {
        console.error('生成失败', error);
        setIsError(true);
        const msg =
          axios.isAxiosError(error) && error.response?.data?.error
            ? String(error.response.data.error)
            : error instanceof Error
              ? error.message
              : '生成失败，请重试';
        setErrorMessage(msg);
      }
    };

    if (router.isReady) generate();
  }, [router.isReady, router.query.storyId, router]);

  return (
    <div className="kid-page flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
      {/* 浮动背景：云朵与星星 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <span className="absolute top-[15%] left-[10%] text-4xl opacity-20 animate-float-slow">☁️</span>
        <span className="absolute top-[25%] right-[15%] text-3xl opacity-25 animate-float-slower">⭐</span>
        <span className="absolute bottom-[30%] left-[20%] text-2xl opacity-20 animate-float-slow" style={{ animationDelay: '1s' }}>✨</span>
        <span className="absolute bottom-[20%] right-[10%] text-4xl opacity-20 animate-float-slower" style={{ animationDelay: '2s' }}>☁️</span>
        <span className="absolute top-[50%] left-[5%] text-2xl opacity-15 animate-float-slow" style={{ animationDelay: '0.5s' }}>🌟</span>
        <span className="absolute top-[60%] right-[8%] text-3xl opacity-20 animate-float-slower">✨</span>
      </div>

      <div className="w-full max-w-md kid-card shadow-lg rounded-3xl text-center relative z-10">
        <h2 className="kid-title text-xl sm:text-2xl mb-4">正在生成绘本插画</h2>

        {/* 笔在纸上画画的 CSS 动画 */}
        {!isError && (
          <div className="flex justify-center mb-6" aria-hidden>
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 bg-amber-100 rounded-2xl shadow-inner border-2 border-amber-200" />
              <motion.span
                className="absolute bottom-4 left-1/2 text-3xl -translate-x-1/2"
                animate={{ x: [0, 8, -4, 12, 0], y: [0, 4, 10, 2, 0], rotate: [-5, 2, -2, 3, -5] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              >
                ✏️
              </motion.span>
            </div>
          </div>
        )}

        {isError ? (
          <>
            <p className="text-lg text-red-600 font-semibold mb-4">❌ {errorMessage}</p>
            <button
              type="button"
              onClick={() => router.push('/create')}
              className="kid-btn-primary min-h-14 px-8"
            >
              返回重试
            </button>
          </>
        ) : (
          <>
            <p className="kid-muted text-sm mb-3">实时日志</p>
            <div className="bg-amber-50/80 rounded-2xl border-2 border-amber-200 p-4 max-h-48 overflow-y-auto text-left">
              <AnimatePresence initial={false}>
                {logLines.map((line, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-stone-700 text-base py-0.5 flex items-center gap-2"
                  >
                    <span className="text-amber-500 shrink-0">·</span>
                    {line}
                  </motion.p>
                ))}
              </AnimatePresence>
              <div ref={logEndRef} />
            </div>
            <p className="kid-muted text-sm mt-3">请耐心等待 30～60 秒，画师正在认真画画哦</p>
          </>
        )}
      </div>
    </div>
  );
}
