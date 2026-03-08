'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { PDFDownloadLink, Document, Page, Text, Image, View } from '@react-pdf/renderer';
import JSZip from 'jszip';
import { motion, AnimatePresence } from 'framer-motion';
import { pdfFontFamily } from '../../lib/pdf-fonts';
import FloatingToolbar from '@/components/FloatingToolbar';

interface PageData {
  index: number;
  text: string;
  imageUrl: string;
}

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 56 : -56,
    opacity: 0,
    scale: 0.98,
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  }),
  center: { x: 0, opacity: 1, scale: 1, boxShadow: 'var(--kid-shadow-magic)' },
  exit: (direction: number) => ({
    x: direction > 0 ? -56 : 56,
    opacity: 0,
    scale: 0.98,
    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
  }),
};

export default function PreviewPage() {
  const router = useRouter();
  const [fullStory, setFullStory] = useState<{ title: string; pages: PageData[] } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [shareStatus, setShareStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [moreOpen, setMoreOpen] = useState(false);
  const textEditRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 50;
    if (dx > threshold) goPrev();
    else if (dx < -threshold) goNext();
  };

  useEffect(() => {
    const data = sessionStorage.getItem('fullStory');
    if (!data) {
      router.push('/create');
      return;
    }
    try {
      const raw = JSON.parse(data) as { title?: string; pages?: PageData[] };
      if (!raw?.pages?.length) {
        router.push('/create');
        return;
      }
      const normalized = {
        title: raw.title || '我的绘本',
        pages: raw.pages,
      };
      setFullStory(normalized);
    } catch {
      router.push('/create');
    }
  }, [router]);

  const savePageText = useCallback(
    (pageIndex: number, newText: string) => {
      if (!fullStory?.pages?.length) return;
      const safeIndex = Math.max(0, Math.min(pageIndex, fullStory.pages.length - 1));
      const updated = {
        ...fullStory,
        pages: fullStory.pages.map((p, i) =>
          i === safeIndex ? { ...p, text: newText } : p
        ),
      };
      setFullStory(updated);
      sessionStorage.setItem('fullStory', JSON.stringify(updated));
    },
    [fullStory]
  );

  const goPrev = () => {
    if (currentPage > 0) {
      const t = textEditRef.current?.innerText?.trim();
      if (t !== undefined && fullStory) savePageText(currentPage, t || fullStory.pages[currentPage].text);
      setDirection(-1);
      setCurrentPage((p) => p - 1);
    }
  };

  const goNext = () => {
    if (fullStory && currentPage < fullStory.pages.length - 1) {
      const t = textEditRef.current?.innerText?.trim();
      if (t !== undefined && fullStory) savePageText(currentPage, t || fullStory.pages[currentPage].text);
      setDirection(1);
      setCurrentPage((p) => p + 1);
    }
  };

  const handleTextBlur = () => {
    if (!textEditRef.current || !fullStory) return;
    const newText = textEditRef.current.innerText.trim() || fullStory.pages[currentPage].text;
    savePageText(currentPage, newText);
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `我的漫画：${fullStory?.title ?? ''}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: fullStory?.title, text, url });
        setShareStatus('success');
      } else {
        await navigator.clipboard?.writeText(`${text}\n${url}`);
        setShareStatus('success');
      }
    } catch {
      setShareStatus('error');
    }
    setTimeout(() => setShareStatus('idle'), 2000);
  };

  const downloadCurrentImage = () => {
    if (!fullStory) return;
    const page = fullStory.pages[currentPage];
    const link = document.createElement('a');
    link.href = page.imageUrl;
    link.download = `${fullStory.title}-第${currentPage + 1}页.png`;
    link.click();
  };

  const downloadAllImagesAsZip = async () => {
    if (!fullStory) return;
    const zip = new JSZip();
    const folder = zip.folder(fullStory.title) ?? zip;
    for (let i = 0; i < fullStory.pages.length; i++) {
      const res = await fetch(fullStory.pages[i].imageUrl);
      const blob = await res.blob();
      folder.file(`第${i + 1}页.png`, blob);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `${fullStory.title}-全部图片.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handlePrint = () => {
    if (!fullStory) return;
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${fullStory.title}</title>
          <style>
            body { font-family: "KaiTi", "楷体", "PingFang SC", sans-serif; padding: 16px; }
            .page { page-break-after: always; margin-bottom: 24px; }
            .page:last-child { page-break-after: auto; }
            .page img { width: 100%; height: auto; display: block; border-radius: 12px; }
            .page .text { margin-top: 12px; font-size: 18px; line-height: 1.8; color: #292524; }
          </style>
        </head>
        <body>
          ${fullStory.pages
            .map(
              (p) => `
            <div class="page">
              <img src="${p.imageUrl}" alt="第${p.index + 1}页" />
              <div class="text">${p.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            </div>
          `
            )
            .join('')}
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 300);
  };

  if (!fullStory) {
    return (
      <div className="kid-page flex items-center justify-center min-h-screen">
        <p className="kid-muted font-medium">加载中…</p>
      </div>
    );
  }

  const safePageIndex = Math.max(0, Math.min(currentPage, fullStory.pages.length - 1));
  const page = fullStory.pages[safePageIndex];
  if (!page) {
    return (
      <div className="kid-page flex items-center justify-center min-h-screen">
        <p className="kid-muted font-medium">暂无页面数据</p>
        <button type="button" onClick={() => router.push('/')} className="kid-btn-secondary mt-4">返回首页</button>
      </div>
    );
  }

  const PDFDoc = () => (
    <Document>
      {fullStory.pages.map((p, idx) => (
        <Page size="A4" key={idx} style={{ padding: 20 }}>
          <View style={{ marginBottom: 12 }}>
            <Image src={p.imageUrl} style={{ width: '100%', objectFit: 'contain' }} />
          </View>
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontFamily: pdfFontFamily, fontSize: 14, lineHeight: 1.5 }}>
              {p.text}
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  );

  return (
    <div className="kid-page pb-28">
      <div className="mx-auto max-w-xl">
        <h1 className="kid-title text-xl sm:text-2xl mb-6 text-center">{fullStory.title}</h1>

        <div
          className="mb-6 touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentPage}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'tween', duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
              className="kid-card rounded-3xl overflow-hidden"
              style={{ boxShadow: 'var(--kid-shadow-primary)' }}
            >
              <div className="rounded-2xl overflow-hidden bg-[var(--kid-primary-soft)]/50">
                <img
                  src={page.imageUrl}
                  alt={`第${page.index + 1}页`}
                  className="w-full block"
                />
              </div>
              <div className="kid-paper rounded-2xl mt-3 p-4 min-h-[5rem] border-2 border-[var(--kid-border-light)] shadow-inner">
                <p className="kid-muted text-xs mb-2">点击文字可编辑</p>
                <div
                  ref={textEditRef}
                  contentEditable
                  suppressContentEditableWarning
                  key={currentPage}
                  className="kid-reading text-lg leading-relaxed text-stone-800 outline-none w-full"
                  onBlur={handleTextBlur}
                  onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                >
                  {page.text}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-between items-center mb-8">
          <button
            type="button"
            onClick={goPrev}
            disabled={currentPage === 0}
            className="kid-btn-secondary min-h-14 px-6 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl"
          >
            ← 上一页
          </button>
          <span className="kid-muted font-semibold text-lg">
            第 {currentPage + 1} 页 / 共 {fullStory.pages.length} 页
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={currentPage === fullStory.pages.length - 1}
            className="kid-btn-secondary min-h-14 px-6 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl"
          >
            下一页 →
          </button>
        </div>
      </div>

      {/* 底部操作栏：桌面全展示，移动端主操作 +「更多」折叠 */}
      <nav
        className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-20"
        aria-label="绘本操作"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-wrap justify-center gap-2 max-w-lg bg-white/95 backdrop-blur-sm rounded-full py-2 px-4 shadow-lg border border-[var(--kid-border-light)]">
            <PDFDownloadLink document={<PDFDoc />} fileName={`${fullStory.title}.pdf`}>
              {({ loading }) => (
                <motion.button
                  type="button"
                  disabled={loading}
                  className="w-12 h-12 rounded-full bg-[var(--kid-primary)] text-white shadow-md flex items-center justify-center text-lg hover:opacity-90 disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--kid-primary)]"
                  whileHover={{ scale: loading ? 1 : 1.06 }}
                  whileTap={{ scale: 0.96 }}
                  title={loading ? '生成中…' : '导出 PDF'}
                  aria-label={loading ? '正在生成 PDF' : '导出 PDF'}
                >
                  {loading ? <span className="animate-pulse">⋯</span> : '📄'}
                </motion.button>
              )}
            </PDFDownloadLink>
            <motion.button
              type="button"
              onClick={handleShare}
                className="w-12 h-12 rounded-full bg-[var(--kid-magic)] text-white shadow-md flex items-center justify-center text-lg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--kid-magic)]"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              title={shareStatus === 'success' ? '已分享' : shareStatus === 'error' ? '已复制到剪贴板' : '分享'}
              aria-label={shareStatus === 'success' ? '已分享' : shareStatus === 'error' ? '链接已复制' : '分享绘本'}
            >
              {shareStatus === 'success' ? '✓' : shareStatus === 'error' ? '📋' : '📤'}
            </motion.button>
            {/* 移动端折叠：打印、当前页、ZIP */}
            <div className="hidden sm:flex gap-2">
              <motion.button
                type="button"
                onClick={handlePrint}
                className="w-12 h-12 rounded-full bg-[var(--kid-star)] text-white shadow-md flex items-center justify-center text-lg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--kid-star)]"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
                title="打印"
                aria-label="打印绘本"
              >
                🖨️
              </motion.button>
              <motion.button
                type="button"
                onClick={downloadCurrentImage}
                className="w-12 h-12 rounded-full bg-[var(--kid-primary)] text-white shadow-md flex items-center justify-center text-lg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--kid-primary)]"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
                title="下载当前页图片"
                aria-label="下载当前页图片"
              >
                🖼️
              </motion.button>
              <motion.button
                type="button"
                onClick={downloadAllImagesAsZip}
                className="w-12 h-12 rounded-full bg-[var(--kid-magic)] text-white shadow-md flex items-center justify-center text-lg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--kid-magic)]"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
                title="下载全部图片（ZIP）"
                aria-label="下载全部图片为 ZIP"
              >
                📦
              </motion.button>
            </div>
            <div className="sm:hidden relative">
              <motion.button
                type="button"
                onClick={() => setMoreOpen((o) => !o)}
                className="w-12 h-12 rounded-full bg-[var(--kid-magic-light)] text-white shadow-md flex items-center justify-center text-lg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--kid-magic-light)]"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
                title="更多操作"
                aria-label="更多操作"
                aria-expanded={moreOpen}
              >
                ⋯
              </motion.button>
              {moreOpen && (
                <>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex gap-2 py-2 px-3 bg-white rounded-2xl shadow-lg border border-[var(--kid-border-light)] z-[20]">
                    <motion.button
                      type="button"
                      onClick={() => { handlePrint(); setMoreOpen(false); }}
                      className="w-10 h-10 rounded-full bg-[var(--kid-star)] text-white flex items-center justify-center text-sm"
                      title="打印"
                      aria-label="打印"
                    >
                      🖨️
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => { downloadCurrentImage(); setMoreOpen(false); }}
                      className="w-10 h-10 rounded-full bg-[var(--kid-primary)] text-white flex items-center justify-center text-sm"
                      title="下载当前页"
                      aria-label="下载当前页"
                    >
                      🖼️
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => { downloadAllImagesAsZip(); setMoreOpen(false); }}
                      className="w-10 h-10 rounded-full bg-[var(--kid-magic-light)] text-white flex items-center justify-center text-sm"
                      title="全部 ZIP"
                      aria-label="下载全部图片 ZIP"
                    >
                      📦
                    </motion.button>
                  </div>
                  <button
                    type="button"
                    className="fixed inset-0 z-[18]"
                    aria-label="关闭更多"
                    onClick={() => setMoreOpen(false)}
                  />
                </>
              )}
            </div>
            <motion.button
              type="button"
              onClick={() => router.push('/')}
              className="w-12 h-12 rounded-full bg-stone-500 text-white shadow-md flex items-center justify-center text-lg hover:bg-stone-600 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-500"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              title="返回首页"
              aria-label="返回首页"
            >
              🏠
            </motion.button>
          </div>
        </div>
      </nav>

      <FloatingToolbar
        onPrint={handlePrint}
        onDownload={downloadCurrentImage}
        onShare={handleShare}
      />
    </div>
  );
}
