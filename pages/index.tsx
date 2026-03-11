import Head from 'next/head';
import Link from 'next/link';

export default function PortalPage() {
  return (
    <>
      <Head>
        <title>暖暖的小世界</title>
        <meta name="description" content="把每一个珍贵的家庭瞬间，变成会说故事的绘本" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Ma+Shan+Zheng&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ background: '#F0F8FF', minHeight: '100vh', fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif' }}>

        {/* ══════════════════════════════════════════
            HERO — 全屏背景图 + 大气氛围层叠
        ══════════════════════════════════════════ */}
        <div style={{ position: 'relative', height: '72vh', minHeight: '440px', maxHeight: '700px', overflow: 'hidden' }}>

          {/* 背景图 */}
          <img
            src="/bg-playground.png"
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%' }}
          />

          {/* 氛围层1：四边暗角，让中心更亮 */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 42%, transparent 25%, rgba(0,20,50,0.35) 100%)',
          }} />

          {/* 氛围层2：海洋蓝色调 */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg, rgba(0,120,200,0.08) 0%, rgba(0,60,120,0.15) 100%)',
          }} />

          {/* 氛围层3：底部渐出 → 与页面背景色完美衔接 */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '55%',
            background: 'linear-gradient(to top, #F0F8FF 0%, rgba(240,248,255,0.6) 50%, transparent 100%)',
          }} />

          {/* 顶部导航 */}
          <nav style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1.5rem 2rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🌟</span>
              <span style={{
                fontFamily: 'ZCOOL KuaiLe, sans-serif',
                fontSize: '1.3rem', fontWeight: 700,
                color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.4)',
              }}>暖暖的小世界</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.1em' }}>
              dingmiaoxuan.com
            </span>
          </nav>

          {/* Hero 文字 — 置于图像正中偏上 */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '0 1.5rem',
            paddingBottom: '15%',
          }}>
            <h1 style={{
              fontFamily: 'ZCOOL KuaiLe, sans-serif',
              fontSize: 'clamp(2.2rem, 7vw, 4.2rem)',
              color: '#fff',
              textShadow: '0 4px 28px rgba(0,0,0,0.5)',
              margin: '0 0 0.875rem',
              letterSpacing: '0.04em',
              textAlign: 'center',
              lineHeight: 1.15,
            }}>
              把今天，变成<br />永远的故事
            </h1>
            <p style={{
              fontSize: 'clamp(0.9rem, 2.5vw, 1.05rem)',
              color: 'rgba(255,255,255,0.88)',
              textShadow: '0 2px 14px rgba(0,0,0,0.45)',
              margin: 0, textAlign: 'center',
              maxWidth: '360px', lineHeight: 1.65,
            }}>
              为暖暖，也为每一个值得被永远珍藏的家庭瞬间
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            主内容 — 与 hero 无缝相连
        ══════════════════════════════════════════ */}
        <div style={{ maxWidth: '780px', margin: '0 auto', padding: '0 1.25rem 5rem' }}>

          {/* ── 主卡片：暖暖绘本 ── */}
          {/* 关键：负 margin 让卡片"嵌入"hero底部，消除断裂感 */}
          <Link href="/create" style={{ textDecoration: 'none', display: 'block', marginTop: '-88px', position: 'relative', zIndex: 10 }}>
            <div
              style={{
                background: '#fff',
                borderRadius: '2rem',
                overflow: 'hidden',
                boxShadow: '0 24px 80px rgba(180,80,30,0.14), 0 6px 24px rgba(0,0,0,0.07)',
                transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(-8px)';
                el.style.boxShadow = '0 40px 100px rgba(180,80,30,0.18), 0 10px 40px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = '';
                el.style.boxShadow = '0 24px 80px rgba(180,80,30,0.14), 0 6px 24px rgba(0,0,0,0.07)';
              }}
            >
              {/* 绘本插画 — 卡片顶部 */}
              <div style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
                <img
                  src="/img-book.png"
                  alt="魔法绘本"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 35%' }}
                />
                {/* 插画下方渐出 */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '110px',
                  background: 'linear-gradient(to top, #F0F8FF 0%, transparent 100%)',
                }} />
                {/* 暖色调叠加 */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(135deg, rgba(255,150,70,0.08) 0%, rgba(130,80,220,0.08) 100%)',
                }} />
              </div>

              {/* 文字区 */}
              <div style={{ padding: '0.25rem 2rem 2.25rem' }}>

                {/* 标题行 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span style={{
                    fontFamily: 'ZCOOL KuaiLe, sans-serif',
                    fontSize: '1.8rem', color: '#2C1810',
                  }}>暖暖绘本</span>
                  <span style={{
                    background: 'linear-gradient(135deg, #FFF0E8, #EDE9FE)',
                    color: '#E07040',
                    fontSize: '0.75rem', fontWeight: 700,
                    padding: '0.22rem 0.75rem', borderRadius: '2rem',
                    border: '1px solid rgba(220,120,60,0.2)',
                  }}>✨ 免费体验</span>
                </div>

                {/* 正文 */}
                <p style={{
                  color: '#6B4C3E', fontSize: '0.95rem', lineHeight: 1.8,
                  margin: '0 0 1.75rem',
                }}>
                  上传今天的照片，AI 帮你生成以家人为主角的专属绘本。<br />
                  动物园的第一次惊喜、爷爷讲的童年故事、六岁的生日派对……<br />
                  每一个瞬间，都值得被永远珍藏。
                </p>

                {/* 三步流程 */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '0', marginBottom: '2rem',
                  background: '#FDF6F0', borderRadius: '1.25rem', padding: '1.1rem',
                }}>
                  {([
                    { icon: '📸', label: '上传照片' },
                    { icon: '✨', label: 'AI 理解场景' },
                    { icon: '📖', label: '生成专属绘本' },
                  ] as { icon: string; label: string }[]).map((s, i) => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      {i > 0 && (
                        <div style={{ color: '#D4A88A', fontSize: '1.1rem', margin: '0 0.25rem', flexShrink: 0 }}>›</div>
                      )}
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{s.icon}</div>
                        <div style={{ fontSize: '0.75rem', color: '#8B5E4A', fontWeight: 600, lineHeight: 1.3 }}>{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA 按钮 */}
                <div style={{
                  background: 'linear-gradient(135deg, #FF8A5C 0%, #8B5CF6 100%)',
                  color: '#fff', borderRadius: '1.25rem',
                  padding: '1.05rem', textAlign: 'center',
                  fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.03em',
                  boxShadow: '0 8px 32px rgba(255,100,60,0.30)',
                }}>
                  进入绘本乐园 →
                </div>
              </div>
            </div>
          </Link>

          {/* ── 暖暖相册 (Coming soon) ── */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{
              background: 'rgba(240,248,255,0.85)',
              borderRadius: '1.5rem',
              padding: '1.25rem 1.5rem',
              display: 'flex', alignItems: 'center', gap: '1.1rem',
              border: '1px solid rgba(230,200,180,0.5)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '1rem', flexShrink: 0,
                background: 'linear-gradient(135deg, #FFE8D6 0%, #DBEAFE 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem',
              }}>📸</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#3C2418', marginBottom: '0.2rem' }}>暖暖相册</div>
                <div style={{ fontSize: '0.82rem', color: '#A07860' }}>家庭成长时光轴</div>
              </div>
              <div style={{
                fontSize: '0.72rem', color: '#C4937A', fontWeight: 700,
                padding: '0.28rem 0.875rem', borderRadius: '2rem',
                border: '1px solid #EDD0C0', background: '#FFF4EE',
                letterSpacing: '0.02em',
              }}>即将上线</div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer style={{
          textAlign: 'center', padding: '1.75rem 1.5rem',
          borderTop: '1px solid rgba(160,200,230,0.25)',
          color: '#7AAAC4', fontSize: '0.78rem', letterSpacing: '0.03em',
        }}>
          © 2025 暖暖的小世界 · 用爱做的产品
        </footer>
      </div>
    </>
  );
}
