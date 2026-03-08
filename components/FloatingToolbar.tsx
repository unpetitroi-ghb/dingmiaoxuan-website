'use client';

import { Printer, Download, Share2 } from 'lucide-react';

interface FloatingToolbarProps {
  onPrint?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

export default function FloatingToolbar({ onPrint, onDownload, onShare }: FloatingToolbarProps) {
  return (
    <div
      className="fixed bottom-6 right-6 flex gap-2 bg-white/70 backdrop-blur-md p-3 rounded-full border border-white/30 z-30"
      style={{ boxShadow: 'var(--kid-shadow-magic)' }}
    >
      <button
        type="button"
        onClick={onPrint}
        className="p-3 rounded-full text-white hover:scale-110 transition-transform"
        style={{ backgroundColor: 'var(--kid-primary)' }}
        title="打印"
        aria-label="打印"
      >
        <Printer size={20} />
      </button>
      <button
        type="button"
        onClick={onDownload}
        className="p-3 rounded-full text-white hover:scale-110 transition-transform"
        style={{ backgroundColor: 'var(--kid-magic)' }}
        title="下载当前页"
        aria-label="下载当前页"
      >
        <Download size={20} />
      </button>
      <button
        type="button"
        onClick={onShare}
        className="p-3 rounded-full text-white hover:scale-110 transition-transform"
        style={{ backgroundColor: 'var(--kid-star)' }}
        title="分享"
        aria-label="分享"
      >
        <Share2 size={20} />
      </button>
    </div>
  );
}
