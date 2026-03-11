import Head from 'next/head';
import Link from 'next/link';

// ── 乐园项目列表 ─────────────────────────────────────────────────────────────
const APPS = [
  {
    id: 'nuannuan',
    emoji: '📖',
    roofColor: 'linear-gradient(135deg, #FF8A5C, #8B5CF6)',
    bgColor: '#fff8f5',
    badgeColor: '#FF8A5C',
    badge: '✨ 现已开放',
    title: '暖暖绘本',
    subtitle: '专属绘本制作工坊',
    desc: '上传今天的照片，AI 帮你生成以家人为主角的专属绘本——动物园、生日、爷爷的故事……每个瞬间都值得被珍藏',
    tags: ['免费体验', 'AI 绘图', '可下载打印'],
    href: '/create',
    btnText: '进入绘本乐园 →',
    btnStyle: 'primary' as const,
    featured: true,
  },
  {
    id: 'album',
    emoji: '📸',
    roofColor: 'linear-gradient(135deg, #60A5FA, #34D399)',
    bgColor: '#f0f9ff',
    badgeColor: '#60A5FA',
    badge: '🔜 即将上线',
    title: '叮叮相册',
    subtitle: '家庭时光轴',
    desc: '上传全家福，AI 自动整理成有温度的家庭成长故事',
    tags: ['智能归类', '时光轴', '家庭分享'],
    href: null,
    btnText: '敬请期待',
    btnStyle: 'coming' as const,
    featured: false,
  },
  {
    id: 'voice',
    emoji: '🎵',
    roofColor: 'linear-gradient(135deg, #F472B6, #A78BFA)',
    bgColor: '#fdf4ff',
    badgeColor: '#F472B6',
    badge: '🔜 即将上线',
    title: '暖暖朗读',
    subtitle: 'AI 声音讲故事',
    desc: '用温柔的 AI 声音朗读你的绘本，睡前故事神器',
    tags: ['儿童声线', '情感朗读', '睡前故事'],
    href: null,
    btnText: '敬请期待',
    btnStyle: 'coming' as const,
    featured: false,
  },
  {
    id: 'game',
    emoji: '🎮',
    roofColor: 'linear-gradient(135deg, #34D399, #06B6D4)',
    bgColor: '#f0fdf4',
    badgeColor: '#34D399',
    badge: '🔜 即将上线',
    title: '叮叮益智',
    subtitle: '绘本互动游戏',
    desc: '基于绘本故事的益智互动，认字、找图、故事排序……让阅读更好玩',
    tags: ['亲子互动', '学认字', '益智拼图'],
    href: null,
    btnText: '敬请期待',
    btnStyle: 'coming' as const,
    featured: false,
  },
];

// ── 装饰云朵数据 ────────────────────────────────────────────────────────────
const CLOUDS = [
  { top: '8%',  left: '5%',  size: '90px', delay: '0s',   opacity: 0.9 },
  { top: '4%',  left: '28%', size: '60px', delay: '2s',   opacity: 0.7 },
  { top: '14%', left: '55%', size: '110px', delay: '1s',  opacity: 0.85 },
  { top: '6%',  left: '78%', size: '75px', delay: '3s',   opacity: 0.75 },
  { top: '20%', left: '90%', size: '55px', delay: '1.5s', opacity: 0.6 },
];

// ── 浮动星星 ────────────────────────────────────────────────────────────────
const STARS = [
  { top: '18%', left: '12%', delay: '0s' },
  { top: '30%', left: '88%', delay: '1.2s' },
  { top: '55%', left: '6%',  delay: '0.8s' },
  { top: '70%', left: '92%', delay: '2.1s' },
  { top: '40%', left: '50%', delay: '1.6s' },
];

export default function PortalPage() {
  return (
    <>
      <Head>
        <title>暖暖的小世界 — dingmiaoxuan.com</title>
        <meta name="description" content="暖暖的小世界，专为家庭打造的儿童数字乐园。暖暖绘本、AI故事、成长相册……每个功能都为珍藏家庭美好时光而生。" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Ma+Shan+Zheng&display=swap" rel="stylesheet" />
      </Head>

      {/* ══ 页面容器 ══ */}
      <div style={{ minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>

        {/* ══ 天空背景 ══ */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0,
          background: 'linear-gradient(180deg, #87CEEB 0%, #B8E4FF 28%, #D4F1B8 58%, #A8D8A8 80%, #8BC8A8 100%)',
        }} />

        {/* ══ 彩虹装饰 ══ */}
        <div className="animate-rainbow" style={{
          position: 'absolute', top: '60px', left: '50%', transform: 'translateX(-50%)',
          width: '500px', height: '200px', zIndex: 1,
          background: 'conic-gradient(from 180deg at 50% 100%, #FF6B6B, #FFD93D, #6BCF63, #4ECDC4, #45B7D1, #A78BFA, #FF6B6B)',
          borderRadius: '500px 500px 0 0',
          opacity: 0.25,
          filter: 'blur(6px)',
          pointerEvents: 'none',
        }} />

        {/* ══ 云朵 ══ */}
        {CLOUDS.map((c, i) => (
          <div key={i} className={i % 2 === 0 ? 'animate-cloud' : 'animate-cloud-slow'} style={{
            position: 'absolute', top: c.top, left: c.left, zIndex: 2,
            width: c.size, opacity: c.opacity,
            animationDelay: c.delay, pointerEvents: 'none',
          }}>
            <CloudSVG />
          </div>
        ))}

        {/* ══ 浮动星星 ══ */}
        {STARS.map((s, i) => (
          <div key={i} className="animate-float-slow" style={{
            position: 'absolute', top: s.top, left: s.left, zIndex: 2,
            fontSize: '1.4rem', animationDelay: s.delay, pointerEvents: 'none', opacity: 0.7,
          }}>
            ⭐
          </div>
        ))}

        {/* ══ 主内容 ══ */}
        <div style={{ position: 'relative', zIndex: 3 }}>

          {/* ── 顶部导航 ── */}
          <nav style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1rem 1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="animate-float-slow" style={{ fontSize: '2rem', display: 'inline-block' }}>🌟</span>
              <div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700,
                  color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}>
                  暖暖的小世界
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.85)', letterSpacing: '0.08em', fontWeight: 600 }}>
                  dingmiaoxuan.com
                </div>
              </div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)',
              borderRadius: '2rem', padding: '0.35rem 0.875rem',
              fontSize: '0.8rem', color: '#fff', fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.5)',
            }}>
              🎪 欢迎光临
            </div>
          </nav>

          {/* ── Hero ── */}
          <section style={{ textAlign: 'center', padding: '1rem 1.5rem 2.5rem' }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)',
              borderRadius: '2rem', padding: '0.5rem 1.25rem',
              fontSize: '0.875rem', color: '#fff', fontWeight: 700,
              border: '1.5px solid rgba(255,255,255,0.5)',
              marginBottom: '1.25rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}>
              🎠 家庭专属数字乐园，现已开放 🎠
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 6vw, 3.5rem)',
              color: '#fff', textShadow: '0 4px 20px rgba(0,0,0,0.2)',
              lineHeight: 1.2, marginBottom: '1rem',
            }}>
              每天都有新冒险 ✨
            </h1>
            <p style={{
              fontSize: '1.1rem', color: 'rgba(255,255,255,0.92)',
              textShadow: '0 2px 8px rgba(0,0,0,0.15)', lineHeight: 1.6,
              maxWidth: '480px', margin: '0 auto',
            }}>
              把每一个珍贵的家庭瞬间，变成会说故事的宝藏
            </p>
          </section>

          {/* ── 乐园地图 ── */}
          <section style={{ padding: '0 1rem 4rem', maxWidth: '960px', margin: '0 auto' }}>

            {/* 地图标题牌 */}
            <div style={{
              textAlign: 'center', marginBottom: '1.75rem',
            }}>
              <div style={{
                display: 'inline-block',
                background: '#fff',
                borderRadius: '1rem', padding: '0.6rem 1.5rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                border: '2.5px solid #FFD93D',
              }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: '#1F2937', fontWeight: 700 }}>
                  🗺️ 乐园地图
                </span>
              </div>
            </div>

            {/* 精选项目 — 暖暖绘本 大卡 */}
            <div className="animate-card-pop" style={{ animationDelay: '0.1s', opacity: 0, marginBottom: '1.25rem' }}>
              <AppCard app={APPS[0]} />
            </div>

            {/* 其余项目 小卡 3列 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {APPS.slice(1).map((app, i) => (
                <div key={app.id} className="animate-card-pop" style={{ animationDelay: `${0.2 + i * 0.1}s`, opacity: 0 }}>
                  <AppCard app={app} />
                </div>
              ))}
            </div>
          </section>

          {/* ── 底部草地 ── */}
          <div style={{
            background: '#5D9B5A', padding: '2rem 1.5rem',
            textAlign: 'center', marginTop: '-1px',
          }}>
            {/* 草地装饰线 */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '0.3rem',
              marginBottom: '1.25rem', flexWrap: 'wrap',
            }}>
              {Array.from({ length: 20 }).map((_, i) => (
                <span key={i} style={{
                  fontSize: '1.4rem', display: 'inline-block',
                  animation: `flag-wave ${1.5 + (i % 3) * 0.4}s ease-in-out infinite`,
                  animationDelay: `${i * 0.12}s`,
                }}>🌱</span>
              ))}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginBottom: '0.4rem' }}>
              暖暖的小世界 · 为爱而建
            </p>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem' }}>
              © 2025 dingmiaoxuan.com · 每个家庭故事都值得被珍藏
            </p>
          </div>

        </div>
      </div>
    </>
  );
}

// ── App 卡片组件 ─────────────────────────────────────────────────────────────
function AppCard({ app }: { app: typeof APPS[number] }) {
  const inner = (
    <div
      style={{
        background: app.bgColor,
        borderRadius: '1.5rem',
        overflow: 'hidden',
        boxShadow: app.featured
          ? '0 12px 48px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)'
          : '0 6px 24px rgba(0,0,0,0.1)',
        border: app.featured ? '2.5px solid rgba(255,255,255,0.8)' : '2px solid rgba(255,255,255,0.7)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: app.href ? 'pointer' : 'default',
      }}
      onMouseEnter={e => {
        if (!app.href) return;
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 60px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.boxShadow = app.featured
          ? '0 12px 48px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)'
          : '0 6px 24px rgba(0,0,0,0.1)';
      }}
    >
      {/* 彩色屋顶 */}
      <div style={{
        background: app.roofColor, padding: app.featured ? '1.5rem' : '1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: app.featured ? '64px' : '52px',
            height: app.featured ? '64px' : '52px',
            background: 'rgba(255,255,255,0.25)',
            borderRadius: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: app.featured ? '2rem' : '1.6rem',
            border: '2px solid rgba(255,255,255,0.4)',
          }}>
            {app.emoji}
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: app.featured ? '1.5rem' : '1.2rem',
              color: '#fff', fontWeight: 700,
              textShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}>
              {app.title}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
              {app.subtitle}
            </div>
          </div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          color: app.badgeColor,
          borderRadius: '2rem', padding: '0.3rem 0.875rem',
          fontSize: '0.78rem', fontWeight: 700,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          whiteSpace: 'nowrap',
        }}>
          {app.badge}
        </div>
      </div>

      {/* 内容区 */}
      <div style={{ padding: app.featured ? '1.5rem 1.75rem' : '1.25rem 1.5rem' }}>
        <p style={{
          color: '#374151', lineHeight: 1.65,
          fontSize: app.featured ? '1rem' : '0.9rem',
          marginBottom: '1rem',
        }}>
          {app.desc}
        </p>

        {/* 标签 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
          {app.tags.map(tag => (
            <span key={tag} style={{
              background: 'rgba(0,0,0,0.06)', color: '#4B5563',
              borderRadius: '2rem', padding: '0.2rem 0.75rem',
              fontSize: '0.8rem', fontWeight: 600,
            }}>
              {tag}
            </span>
          ))}
        </div>

        {/* 按钮 */}
        {app.btnStyle === 'primary' ? (
          <button className="kid-btn-primary" style={{
            width: '100%',
            fontSize: app.featured ? '1.05rem' : '0.95rem',
          }}>
            {app.btnText}
          </button>
        ) : (
          <div style={{
            textAlign: 'center', padding: '0.75rem',
            border: '2px dashed #D1D5DB', borderRadius: '1rem',
            color: '#9CA3AF', fontSize: '0.9rem', fontWeight: 600,
          }}>
            {app.btnText} 🔜
          </div>
        )}
      </div>
    </div>
  );

  if (app.href) {
    return <Link href={app.href} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>;
  }
  return inner;
}

// ── 云朵 SVG ─────────────────────────────────────────────────────────────────
function CloudSVG() {
  return (
    <svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))' }}>
      <ellipse cx="50" cy="45" rx="40" ry="18" fill="white" />
      <ellipse cx="35" cy="38" rx="22" ry="20" fill="white" />
      <ellipse cx="62" cy="35" rx="25" ry="22" fill="white" />
      <ellipse cx="50" cy="30" rx="20" ry="18" fill="white" />
    </svg>
  );
}
