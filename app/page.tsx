import Link from 'next/link';

const STEPS = [
  { title: '上传照片', desc: '选择孩子的照片或家庭照' },
  { title: '取名与创意', desc: '为主角取名，写下故事想法' },
  { title: 'AI 生成', desc: '脚本与插画自动生成' },
  { title: '导出绘本', desc: 'PDF、打印或分享' },
];

export default function HomePage() {
  return (
    <main className="kid-page relative min-h-screen">
      {/* 魔法粒子背景 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-float-particle"
            style={{
              left: `${(i * 17 + 5) % 100}%`,
              top: `${(i * 23 + 10) % 100}%`,
              backgroundColor: 'var(--kid-magic-light)',
              opacity: 0.5,
              animationDelay: `${(i % 5) * 1.2}s`,
              animationDuration: `${8 + (i % 4)}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-10">
        <h1 className="kid-title text-center text-3xl sm:text-4xl mb-2">
          ✨ 暖暖绘本 🔮
        </h1>
        <p className="kid-muted text-center text-lg mb-10">
          用你家照片与角色，AI 理解并汇总成故事，生成独一无二的魔法绘本
        </p>

        <div className="flex justify-center mb-10">
          <Link
            href="/create"
            className="kid-btn-primary px-8 py-4 text-lg rounded-2xl"
          >
            开始创作
          </Link>
        </div>

        <div className="flex overflow-x-auto snap-x scroll-pl-4 gap-4 pb-4 -mx-4 px-4">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="kid-card snap-start w-4/5 min-w-[280px] md:w-1/4 flex-shrink-0"
            >
              <div className="text-2xl mb-2">
                {['📷', '✏️', '🪄', '📖'][i]}
              </div>
              <h2 className="kid-heading text-lg mb-1">{step.title}</h2>
              <p className="kid-muted text-sm">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <img
            src="/hero-image.jpg"
            alt="绘本预览"
            className="mx-auto max-w-full rounded-2xl shadow-lg max-h-64 object-cover"
          />
        </div>
      </div>
    </main>
  );
}
