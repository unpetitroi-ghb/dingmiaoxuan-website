'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { PDFDownloadLink, Document, Page, Text, Image, View } from '@react-pdf/renderer';
import JSZip from 'jszip';
import { motion, AnimatePresence } from 'framer-motion';
import { pdfFontFamily } from '../../lib/pdf-fonts';

interface PageData {
  index: number;
  text: string;
  imageUrl: string;
}

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};

export default function PreviewPage() {
  const router = useRouter();
  const [fullStory, setFullStory] = useState<{ title: string; pages: PageData[] } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [shareStatus, setShareStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const textEditRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = sessionStorage.getItem('fullStory');
    if (!data) {
      router.push('/create');
      return;
    }
    setFullStory(JSON.parse(data));
  }, [router]);

  const savePageText = useCallback(
    (pageIndex: number, newText: string) => {
      if (!fullStory) return;
      const updated = {
        ...fullStory,
        pages: fullStory.pages.map((p, i) =>
          i === pageIndex ? { ...p, text: newText } : p
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

  const page = fullStory.pages[currentPage];

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

        <div className="mb-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentPage}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'tween', duration: 0.3 }}
              className="kid-card shadow-lg rounded-3xl overflow-hidden"
            >
              <div className="rounded-2xl overflow-hidden bg-amber-100/50">
                <img
                  src={page.imageUrl}
                  alt={`第${page.index + 1}页`}
                  className="w-full block"
                />
              </div>
              <div className="kid-paper rounded-2xl mt-3 p-4 min-h-[5rem] border-2 border-amber-200/60 shadow-inner">
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
            {currentPage + 1} / {fullStory.pages.length}
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

      {/* 底部悬浮泡泡操作栏 */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-3 px-4 z-20">
        <div className="flex flex-wrap justify-center gap-3 max-w-lg">
          <PDFDownloadLink document={<PDFDoc />} fileName={`${fullStory.title}.pdf`}>
            {({ loading }) => (
              <motion.button
                type="button"
                disabled={loading}
                className="w-14 h-14 rounded-full bg-orange-500 text-white shadow-lg flex items-center justify-center text-xl hover:bg-orange-600 disabled:opacity-70"
                whileHover={{ scale: loading ? 1 : 1.08 }}
                whileTap={{ scale: 0.95 }}
                title={loading ? '生成中…' : '导出 PDF'}
              >
                {loading ? <span className="animate-pulse">⋯</span> : '📄'}
              </motion.button>
            )}
          </PDFDownloadLink>
          <motion.button
            type="button"
            onClick={handleShare}
            className="w-14 h-14 rounded-full bg-teal-400 text-white shadow-lg flex items-center justify-center text-xl hover:bg-teal-500"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            title={shareStatus === 'success' ? '已分享' : shareStatus === 'error' ? '已复制' : '分享'}
          >
            {shareStatus === 'success' ? '✓' : shareStatus === 'error' ? '📋' : '📤'}
          </motion.button>
          <motion.button
            type="button"
            onClick={handlePrint}
            className="w-14 h-14 rounded-full bg-amber-400 text-white shadow-lg flex items-center justify-center text-xl hover:bg-amber-500"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            title="打印"
          >
            🖨️
          </motion.button>
          <motion.button
            type="button"
            onClick={downloadCurrentImage}
            className="w-14 h-14 rounded-full bg-rose-400 text-white shadow-lg flex items-center justify-center text-xl hover:bg-rose-500"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            title="下载当前页"
          >
            🖼️
          </motion.button>
          <motion.button
            type="button"
            onClick={downloadAllImagesAsZip}
            className="w-14 h-14 rounded-full bg-violet-400 text-white shadow-lg flex items-center justify-center text-xl hover:bg-violet-500"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            title="全部图片 ZIP"
          >
            📦
          </motion.button>
          <motion.button
            type="button"
            onClick={() => router.push('/')}
            className="w-14 h-14 rounded-full bg-stone-500 text-white shadow-lg flex items-center justify-center text-xl hover:bg-stone-600"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            title="返回首页"
          >
            🏠
          </motion.button>
        </div>
      </div>
    </div>
  );
}
