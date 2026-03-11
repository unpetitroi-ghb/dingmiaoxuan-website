import Head from 'next/head';
import Link from 'next/link';

const COMING_SOON = [
  {
    emoji: '📸',
    title: '暖暖相册',
    desc: '家庭成长时光轴',
  },
];

export default function PortalPage() {
  return (
    <>
      <Head>
        <title>暖暖的小世界</title>
        <meta name="description" content="暖暖的小世界 — 专为家庭打造的数字乐园" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: '100vh', background: '#FAFAF8', fontFamily: 'var(--font-sans), "PingFang SC", "Microsoft YaHei", sans-serif' }}>

        {/* ── 导航 ── */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 2rem', maxWidth: '960px', margin: '0 auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🌟</span>
            <span style={{
              fontFamily: 'ZCOOL KuaiLe, sans-serif',
              fontSize: '1.25rem', fontWeight: 700, color: '#1a1a1a',
            }}>
              暖暖的小世界
            </span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#999', letterSpacing: '0.05em' }}>
            dingmiaoxuan.com
          </span>
        </nav>

        {/* ── Hero 背景图 ── */}
        <div style={{
          width: '100%', height: '320px', overflow: 'hidden', position: 'relative',
        }}>
          <img
            src="/bg-playground.png"
            alt=""
            style={{
              width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%',
              display: 'block',
            }}
          />
          {/* 顶部渐入 */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '60px',
            background: 'linear-gradient(to bottom, #FAFAF8, transparent)',
          }} />
          {/* 底部渐出 */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px',
            background: 'linear-gradient(to top, #FAFAF8, transparent)',
          }} />
          {/* 中心文字 */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <h1 style={{
              fontFamily: 'ZCOOL KuaiLe, sans-serif',
              fontSize: 'clamp(2rem, 6vw, 3rem)',
              color: '#fff',
              textShadow: '0 2px 20px rgba(0,0,0,0.35)',
              margin: 0, letterSpacing: '0.02em',
            }}>
              每天都有新冒险
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: '1rem', marginTop: '0.5rem',
              textShadow: '0 1px 8px rgba(0,0,0,0.3)',
            }}>
              把每一个珍贵的家庭瞬间，变成会说故事的宝藏
            </p>
          </div>
        </div>

        {/* ── 主内容 ── */}
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>

          {/* ── 暖暖绘本主卡 ── */}
          <Link href="/create" style={{ textDecoration: 'none', display: 'block', marginBottom: '1.5rem' }}>
            <div style={{
              background: '#fff',
              borderRadius: '1.5rem',
              overflow: 'hidden',
              boxShadow: '0 2px 24px rgba(0,0,0,0.08)',
              border: '1px solid #eee',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 40px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 24px rgba(0,0,0,0.08)';
              }}
            >
              {/* 绘本插图 */}
              <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                <img
                  src="/img-book.png"
                  alt="魔法绘本"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px',
                  background: 'linear-gradient(to top, #fff, transparent)',
                }} />
              </div>

              {/* 文字区 */}
              <div style={{ padding: '1.5rem 2rem 2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>📖</span>
                    <span style={{
                      fontFamily: 'ZCOOL KuaiLe, sans-serif',
                      fontSize: '1.5rem', fontWeight: 700, color: '#1a1a1a',
                    }}>暖暖绘本</span>
                    <span style={{
                      background: '#FFF3EE', color: '#FF8A5C',
                      fontSize: '0.75rem', fontWeight: 700,
                      padding: '0.2rem 0.6rem', borderRadius: '2rem',
                      border: '1px solid #FFD4BC',
                    }}>✨ 免费体验</span>
                  </div>
                  <p style={{ color: '#555', fontSize: '0.95rem', lineHeight: 1.6, margin: 0, maxWidth: '480px' }}>
                    上传今天的照片，AI 帮你生成以家人为主角的专属绘本。动物园、生日、爷爷的故事……每个瞬间都值得被珍藏。
                  </p>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #FF8A5C, #8B5CF6)',
                  color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                  padding: '0.75rem 1.75rem', borderRadius: '2rem',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  进入绘本乐园 →
                </div>
              </div>
            </div>
          </Link>

          {/* ── 即将上线 三格 ── */}
          <p style={{ fontSize: '0.8rem', color: '#bbb', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.875rem' }}>
            更多玩法即将上线
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
            {COMING_SOON.map(app => (
              <div key={app.title} style={{
                background: '#fff', borderRadius: '1.25rem',
                padding: '1.5rem', border: '1px solid #eee',
                display: 'flex', alignItems: 'center', gap: '1rem',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '0.875rem',
                  background: '#F5F5F3', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0,
                }}>
                  {app.emoji}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a', marginBottom: '0.2rem' }}>
                    {app.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#999' }}>{app.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 底部 ── */}
        <footer style={{
          borderTop: '1px solid #eee', padding: '1.5rem',
          textAlign: 'center', color: '#bbb', fontSize: '0.8rem',
        }}>
          © 2025 暖暖的小世界 · 用爱做的产品
        </footer>
      </div>
    </>
  );
}
