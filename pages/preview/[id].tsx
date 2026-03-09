import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface BookPage { index: number; text: string; imageUrl: string; }
interface Book {
  id: string; title: string; characterName: string;
  characterLabel: string; style: string;
  pages: BookPage[]; createdAt: string;
}

export default function PreviewPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('left');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/book/${id}`)
      .then(r => r.json())
      .then((data: Book | { error?: string }) => {
        if ('error' in data) throw new Error(data.error);
        setBook(data as Book);
      })
      .catch(e => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [id]);

  function goPage(next: number) {
    if (!book) return;
    setDirection(next > currentPage ? 'left' : 'right');
    setCurrentPage(Math.max(0, Math.min(next, book.pages.length - 1)));
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  async function handleDownload() {
    if (!book) return;
    setDownloading(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const folder = zip.folder(book.title) ?? zip;

      // 添加文字版本
      const textContent = book.pages.map((p, i) => `第 ${i + 1} 页\n${p.text}`).join('\n\n---\n\n');
      folder.file('故事文字.txt', `《${book.title}》\n\n${textContent}`);

      // 下载图片并打包
      const imgPromises = book.pages.map(async (p, i) => {
        if (!p.imageUrl) return;
        try {
          const res = await fetch(p.imageUrl);
          const blob = await res.blob();
          folder.file(`第${String(i + 1).padStart(2, '0')}页.jpg`, blob);
        } catch { /* skip failed images */ }
      });
      await Promise.all(imgPromises);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book.title}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('下载失败: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--kid-background)' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="kid-spinner" style={{ margin: '0 auto 1rem', width: '2rem', height: '2rem' }} />
        <p className="kid-muted">正在加载绘本…</p>
      </div>
    </div>
  );

  if (error || !book) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--kid-background)' }}>
      <div className="kid-card" style={{ textAlign: 'center', maxWidth: '360px', padding: '2.5rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
        <p style={{ color: 'var(--kid-error)', marginBottom: '1.5rem' }}>{error || '绘本不存在'}</p>
        <Link href="/create"><button className="kid-btn-primary" style={{ width: '100%' }}>重新创作</button></Link>
      </div>
    </div>
  );

  const page = book.pages[currentPage];
  const total = book.pages.length;

  return (
    <>
      <Head>
        <title>《{book.title}》— 暖暖绘本</title>
        <link href="https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Ma+Shan+Zheng&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: '100vh', background: 'var(--kid-background)', display: 'flex', flexDirection: 'column' }}>

        {/* 顶部导航 */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 1.25rem', height: '60px',
          background: '#fff', borderBottom: '1px solid var(--kid-border-light)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span className="kid-title" style={{ fontSize: '1.1rem' }}>暖暖绘本</span>
          </Link>
          <span className="kid-muted" style={{ fontSize: '0.9rem' }}>
            《{book.title}》· {book.characterName} · {book.style}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => void handleCopyLink()}
              style={{
                padding: '0.4rem 0.875rem', borderRadius: '0.625rem',
                border: '1.5px solid var(--kid-border-light)',
                background: copied ? 'var(--kid-success)' : '#fff',
                color: copied ? '#fff' : 'var(--kid-text-primary)',
                fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {copied ? '✓ 已复制' : '🔗 分享'}
            </button>
            <button
              onClick={() => void handleDownload()}
              disabled={downloading}
              style={{
                padding: '0.4rem 0.875rem', borderRadius: '0.625rem',
                background: 'linear-gradient(135deg, var(--kid-primary), var(--kid-magic))',
                color: '#fff', border: 'none',
                fontSize: '0.85rem', fontWeight: 600, cursor: downloading ? 'wait' : 'pointer',
                opacity: downloading ? 0.7 : 1,
              }}
            >
              {downloading ? '打包中…' : '💾 下载'}
            </button>
          </div>
        </nav>

        {/* 主内容 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 1rem 3rem' }}>
          <div style={{ width: '100%', maxWidth: '520px' }}>

            {/* 书页 */}
            <div
              key={currentPage}
              className={direction === 'left' ? 'preview-slide-left' : 'preview-slide-right'}
              style={{
                background: '#fff',
                borderRadius: '1.5rem',
                overflow: 'hidden',
                boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
                border: '1.5px solid var(--kid-border-light)',
                marginBottom: '1rem',
              }}
            >
              {/* 插画区 */}
              {page.imageUrl ? (
                <img
                  src={page.imageUrl}
                  alt={`第 ${currentPage + 1} 页插画`}
                  style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{
                  width: '100%', aspectRatio: '4/3',
                  background: 'linear-gradient(135deg, var(--kid-primary-soft) 0%, #f5f0ff 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '3rem',
                }}>
                  🎨
                </div>
              )}

              {/* 文字区 */}
              <div className="kid-paper" style={{ padding: '1.5rem 1.75rem 2rem' }}>
                <p className="kid-reading" style={{
                  fontSize: 'clamp(1.1rem, 4vw, 1.35rem)',
                  lineHeight: 1.8,
                  color: 'var(--kid-text-primary)',
                  textAlign: 'center',
                  margin: 0,
                }}>
                  {page.text}
                </p>
              </div>
            </div>

            {/* 页码导航 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <button
                onClick={() => goPage(currentPage - 1)}
                disabled={currentPage === 0}
                style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  border: '2px solid var(--kid-border-light)',
                  background: '#fff', fontSize: '1.1rem', cursor: 'pointer',
                  opacity: currentPage === 0 ? 0.3 : 1,
                }}
              >
                ◀
              </button>

              <span style={{ fontWeight: 600, color: 'var(--kid-text-primary)', fontSize: '0.95rem', minWidth: '80px', textAlign: 'center' }}>
                第 {currentPage + 1} / {total} 页
              </span>

              <button
                onClick={() => goPage(currentPage + 1)}
                disabled={currentPage === total - 1}
                style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  border: '2px solid var(--kid-border-light)',
                  background: '#fff', fontSize: '1.1rem', cursor: 'pointer',
                  opacity: currentPage === total - 1 ? 0.3 : 1,
                }}
              >
                ▶
              </button>
            </div>

            {/* 缩略图导航 */}
            <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {book.pages.map((p, i) => (
                <button
                  key={i}
                  onClick={() => goPage(i)}
                  style={{
                    flexShrink: 0,
                    width: '52px', height: '52px',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    border: i === currentPage ? '2px solid var(--kid-magic)' : '2px solid transparent',
                    cursor: 'pointer', padding: 0, background: 'var(--kid-card-alt)',
                  }}
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>🎨</span>
                  )}
                </button>
              ))}
            </div>

            {/* 底部操作 */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
              <Link href="/create" style={{ flex: 1, textDecoration: 'none' }}>
                <button className="kid-btn-secondary" style={{ width: '100%' }}>再创作一本</button>
              </Link>
              <button
                className="kid-btn-primary"
                style={{ flex: 1 }}
                onClick={() => void handleDownload()}
                disabled={downloading}
              >
                {downloading ? '打包中…' : '💾 下载全部图片'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
