import Head from 'next/head';
import Link from 'next/link';

const SCENARIOS = [
  { emoji: '🦁', title: '动物园奇遇记', desc: '孩子第一次见到长颈鹿，好奇又兴奋' },
  { emoji: '💕', title: '爸爸妈妈的爱情故事', desc: '把你们相遇的故事，讲给孩子听' },
  { emoji: '🌏', title: '爷爷的童年往事', desc: '让老人的故事，跨越时间传给下一代' },
  { emoji: '🎂', title: '六岁生日的惊喜', desc: '把这个特别的一天，永远留在绘本里' },
];

const STEPS = [
  { num: '01', icon: '📸', title: '上传照片', desc: '角色照片 + 今天的活动照片，AI来理解你们的故事' },
  { num: '02', icon: '✨', title: 'AI 理解', desc: '自动识别场景与活动，推荐故事方向，你来选' },
  { num: '03', icon: '📖', title: '生成绘本', desc: '专属插画逐页生成，可下载，可分享，永久珍藏' },
];

export default function HomePage() {
  return (
    <>
      <Head>
        <title>暖暖绘本 — 把每个家庭故事变成专属绘本</title>
        <meta name="description" content="上传照片，AI帮你生成以孩子为主角的专属绘本。动物园、生日、家族故事……每个珍贵瞬间都值得被永久珍藏。" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Ma+Shan+Zheng&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ background: 'var(--kid-background)', minHeight: '100vh' }}>

        {/* ── 导航栏 ── */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(249,250,251,0.9)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--kid-border-light)',
          padding: '0 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '64px',
        }}>
          <span className="kid-title" style={{ fontSize: '1.4rem' }}>暖暖绘本</span>
          <Link href="/create">
            <button className="kid-btn-primary" style={{ minHeight: '40px', padding: '0.5rem 1.25rem', fontSize: '0.95rem' }}>
              开始创作
            </button>
          </Link>
        </nav>

        {/* ── Hero ── */}
        <section style={{
          textAlign: 'center',
          padding: '5rem 1.5rem 4rem',
          background: 'linear-gradient(160deg, #fff8f5 0%, #f5f0ff 100%)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* 背景装饰 */}
          <div style={{ position: 'absolute', top: '10%', left: '5%', fontSize: '3rem', opacity: 0.15 }} className="animate-float-slow">🌟</div>
          <div style={{ position: 'absolute', top: '20%', right: '8%', fontSize: '2.5rem', opacity: 0.12 }} className="animate-float-slower">📖</div>
          <div style={{ position: 'absolute', bottom: '15%', left: '10%', fontSize: '2rem', opacity: 0.1 }} className="animate-float-slow">🎨</div>
          <div style={{ position: 'absolute', bottom: '10%', right: '5%', fontSize: '3rem', opacity: 0.12 }} className="animate-float-slower">✨</div>

          <div style={{ maxWidth: '680px', margin: '0 auto', position: 'relative' }}>
            <div style={{
              display: 'inline-block',
              background: 'var(--kid-primary-soft)',
              color: 'var(--kid-primary-dark)',
              borderRadius: '2rem',
              padding: '0.35rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: '1.5rem',
            }}>
              🎉 AI 驱动 · 专属定制 · 永久珍藏
            </div>

            <h1 className="kid-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', lineHeight: 1.2, marginBottom: '1.25rem' }}>
              把今天，变成<br />永远的故事
            </h1>

            <p className="kid-muted" style={{ fontSize: '1.125rem', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '480px', margin: '0 auto 2.5rem' }}>
              上传几张照片，10 分钟生成专属绘本<br />
              让每个珍贵的家庭瞬间，都值得被永久珍藏
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/create">
                <button className="kid-btn-primary" style={{ fontSize: '1.1rem', padding: '0.875rem 2.5rem' }}>
                  🌟 免费创作第一本
                </button>
              </Link>
              <a href="#how-it-works" style={{ textDecoration: 'none' }}>
                <button className="kid-btn-secondary" style={{ fontSize: '1.1rem', padding: '0.875rem 2rem' }}>
                  看看怎么做的 →
                </button>
              </a>
            </div>

            <p style={{ marginTop: '1.25rem', color: 'var(--kid-text-muted)', fontSize: '0.85rem' }}>
              第一本免费 · 无需注册 · 5 分钟上手
            </p>
          </div>
        </section>

        {/* ── 使用场景 ── */}
        <section style={{ padding: '4rem 1.5rem', maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '0.75rem', fontSize: '1.6rem', fontWeight: 700, color: 'var(--kid-text-primary)' }}>
            每个家庭都有值得讲述的故事
          </h2>
          <p className="kid-muted" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            不只是孩子，爸爸妈妈、爷爷奶奶的故事都值得被珍藏
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            {SCENARIOS.map((s) => (
              <div key={s.title} className="kid-card" style={{ textAlign: 'center', padding: '1.75rem 1.25rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{s.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--kid-text-primary)' }}>{s.title}</div>
                <div className="kid-caption">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 怎么做的 ── */}
        <section id="how-it-works" style={{
          padding: '4rem 1.5rem',
          background: 'linear-gradient(135deg, #fdf4ff 0%, #fff8f5 100%)',
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '0.75rem', fontSize: '1.6rem', fontWeight: 700 }}>
              三步，生成专属绘本
            </h2>
            <p className="kid-muted" style={{ textAlign: 'center', marginBottom: '3rem' }}>简单到孩子都能操作</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {STEPS.map((step) => (
                <div key={step.num} style={{
                  display: 'flex', alignItems: 'center', gap: '1.5rem',
                  background: '#fff', borderRadius: '1.25rem',
                  padding: '1.5rem 2rem',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  border: '1.5px solid var(--kid-border-light)',
                }}>
                  <div style={{
                    width: '56px', height: '56px', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--kid-primary) 0%, var(--kid-magic) 100%)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}>
                    {step.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--kid-text-primary)', marginBottom: '0.25rem' }}>
                      {step.title}
                    </div>
                    <div className="kid-muted">{step.desc}</div>
                  </div>
                  <div style={{
                    marginLeft: 'auto', fontSize: '2rem', fontWeight: 900,
                    color: 'var(--kid-primary-soft)', fontFamily: 'monospace',
                  }}>
                    {step.num}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 特点 ── */}
        <section style={{ padding: '4rem 1.5rem', maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '1.6rem', fontWeight: 700 }}>
            为什么选择暖暖绘本？
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {[
              { icon: '👤', title: '真实人物主角', desc: '以你家孩子为主角，AI理解照片，保持外貌一致' },
              { icon: '🤖', title: '全程 AI 创作', desc: '豆包视觉理解 + DeepSeek 故事创作 + 即梦 4.0 绘图' },
              { icon: '📚', title: '寓教于乐', desc: '可融入动物知识、历史故事、人生道理等教育元素' },
              { icon: '🎨', title: '多种画风', desc: '水彩绘本、日漫、3D卡通、中国风，自由选择' },
              { icon: '💾', title: '高清下载', desc: '每页高清插画打包下载，支持冲印成实体书' },
              { icon: '🔗', title: '一键分享', desc: '生成专属链接，发给爷爷奶奶，让全家人都能看' },
            ].map((f) => (
              <div key={f.title} style={{
                padding: '1.5rem',
                background: '#fff',
                borderRadius: '1rem',
                border: '1.5px solid var(--kid-border-light)',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
                <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: 'var(--kid-text-primary)' }}>{f.title}</div>
                <div className="kid-caption">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA 底部 ── */}
        <section style={{
          padding: '5rem 1.5rem',
          background: 'linear-gradient(135deg, var(--kid-primary) 0%, var(--kid-magic) 100%)',
          textAlign: 'center',
        }}>
          <h2 style={{ color: '#fff', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 700, marginBottom: '1rem' }}>
            今天的故事，值得被永远记住
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
            第一本完全免费，30 秒开始创作
          </p>
          <Link href="/create">
            <button style={{
              background: '#fff',
              color: 'var(--kid-primary)',
              border: 'none',
              borderRadius: '1.25rem',
              padding: '1rem 3rem',
              fontSize: '1.125rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s',
            }}>
              🌟 免费开始创作
            </button>
          </Link>
        </section>

        {/* ── Footer ── */}
        <footer style={{
          padding: '2rem 1.5rem',
          textAlign: 'center',
          borderTop: '1px solid var(--kid-border-light)',
          color: 'var(--kid-text-muted)',
          fontSize: '0.875rem',
        }}>
          <p style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--kid-text-primary)' }}>暖暖绘本</p>
          <p>用 AI 留住每一个珍贵的家庭故事</p>
          <p style={{ marginTop: '0.75rem', opacity: 0.6 }}>© 2025 暖暖绘本 · 用爱做的产品</p>
        </footer>
      </div>
    </>
  );
}
