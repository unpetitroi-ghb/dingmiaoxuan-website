import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface GeneratedPage {
  index: number;
  text: string;
  imageUrl: string;
}

const FUN_FACTS = [
  '🎨 AI 正在用想象力为你调配专属色彩…',
  '✍️ 故事里的每个细节都经过精心设计…',
  '🌟 每一页插画都是独一无二的艺术品…',
  '📖 你们的故事正在被永久记录下来…',
  '🦁 AI 正在脑补最可爱的画面构图…',
  '💫 用魔法把照片里的瞬间变成故事…',
];

export default function GeneratingPage() {
  const router = useRouter();
  const { jobId, bookId, title } = router.query as { jobId?: string; bookId?: string; title?: string };

  const [stage, setStage] = useState('准备开始…');
  const [percent, setPercent] = useState(0);
  const [bookTitle, setBookTitle] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [pages, setPages] = useState<GeneratedPage[]>([]);
  const [error, setError] = useState('');
  const [fact, setFact] = useState(FUN_FACTS[0]);
  const esRef = useRef<EventSource | null>(null);
  const started = useRef(false);

  // 轮换趣味提示
  useEffect(() => {
    const t = setInterval(() => {
      setFact(FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // 连接 SSE
  useEffect(() => {
    if (!jobId || !bookId || started.current) return;
    started.current = true;

    const es = new EventSource(`/api/stream/${jobId}`);
    esRef.current = es;

    es.onmessage = (e: MessageEvent) => {
      try {
        const ev = JSON.parse(e.data as string) as Record<string, unknown>;

        if (ev.type === 'progress') {
          setStage(ev.stage as string);
          setPercent(ev.percent as number);
        } else if (ev.type === 'script') {
          setBookTitle(ev.title as string);
          setTotalPages(ev.totalPages as number);
        } else if (ev.type === 'page') {
          setPages(prev => [...prev, {
            index: ev.index as number,
            text: ev.text as string,
            imageUrl: ev.imageUrl as string,
          }]);
        } else if (ev.type === 'done') {
          setPercent(100);
          setStage('绘本生成完成！✨');
          es.close();
          setTimeout(() => {
            void router.push(`/preview/${bookId as string}`);
          }, 1500);
        } else if (ev.type === 'error') {
          setError(ev.message as string);
          es.close();
        }
      } catch { /* ignore parse errors */ }
    };

    es.onerror = () => {
      if (percent < 100) {
        setError('连接中断，请刷新页面重试');
      }
      es.close();
    };

    return () => { es.close(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, bookId]);

  return (
    <>
      <Head>
        <title>正在生成绘本… — 暖暖绘本</title>
        <link href="https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #fff8f5 0%, #f5f0ff 100%)', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>

          {/* 标题区 */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="kid-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              {bookTitle ? `《${bookTitle}》` : `${title ?? ''}的专属绘本`}
            </div>
            <p className="kid-muted">{error ? '⚠️ 出错了' : stage}</p>
          </div>

          {/* 进度条 */}
          {!error && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="kid-caption">{stage}</span>
                <span style={{ fontWeight: 700, color: 'var(--kid-magic)', fontSize: '0.9rem' }}>{percent}%</span>
              </div>
              <div style={{ height: '10px', background: 'var(--kid-border-light)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${percent}%`,
                  background: 'linear-gradient(90deg, var(--kid-primary), var(--kid-magic))',
                  borderRadius: '9999px',
                  transition: 'width 0.6s ease',
                }} />
              </div>
              {totalPages > 0 && (
                <p className="kid-caption" style={{ textAlign: 'right', marginTop: '0.4rem' }}>
                  已完成 {pages.length} / {totalPages} 页插画
                </p>
              )}
            </div>
          )}

          {/* 错误状态 */}
          {error && (
            <div className="kid-card" style={{ textAlign: 'center', padding: '2rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
              <p style={{ color: 'var(--kid-error)', marginBottom: '1.5rem', lineHeight: 1.6 }}>{error}</p>
              <button className="kid-btn-secondary" onClick={() => router.push('/create')}>
                返回重新创作
              </button>
            </div>
          )}

          {/* 已生成的页面预览 */}
          {pages.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--kid-text-primary)' }}>
                📖 已生成的页面
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pages.map((p) => (
                  <div key={p.index} className="kid-card" style={{
                    display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.875rem',
                    animation: 'preview-slide-left 0.4s ease-out',
                  }}>
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={`第 ${p.index + 1} 页`}
                        style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '0.5rem', flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{
                        width: '72px', height: '72px', borderRadius: '0.5rem', flexShrink: 0,
                        background: 'var(--kid-card-alt)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem',
                      }}>🎨</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--kid-text-muted)', marginBottom: '0.25rem' }}>
                        第 {p.index + 1} 页
                      </p>
                      <p style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--kid-text-primary)' }}>
                        {p.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 等待动画 + 趣味提示 */}
          {!error && percent < 100 && (
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }} className="animate-pen-draw">🖊️</div>
              <p className="kid-muted" style={{ fontSize: '0.95rem' }}>{fact}</p>
              <p className="kid-caption" style={{ marginTop: '0.75rem', opacity: 0.6 }}>
                预计总时长 5-8 分钟，请勿关闭页面
              </p>
            </div>
          )}

          {/* 完成提示 */}
          {percent === 100 && !error && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
              <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--kid-primary)', marginBottom: '0.5rem' }}>
                绘本生成完成！
              </p>
              <p className="kid-muted">正在跳转到预览页…</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
