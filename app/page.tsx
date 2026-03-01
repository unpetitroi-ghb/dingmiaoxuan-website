import Link from 'next/link';

export default function Home() {
  return (
    <div className="kid-page min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-lg flex flex-col items-center">
          <header className="text-center mb-5 sm:mb-6">
            <h1 className="kid-title text-2xl sm:text-3xl mb-2">AI 魔法绘本</h1>
            <p className="kid-muted text-base sm:text-lg">用你家照片与角色，AI 为你生成独一无二的绘本</p>
          </header>
          <div
            className="w-full flex items-center justify-center mb-6 sm:mb-8 overflow-hidden rounded-3xl border-2 bg-[var(--kid-card)] shadow-[var(--kid-shadow)]"
            style={{ borderColor: 'var(--kid-card-border)' }}
          >
            <img
              src="/hero-image.jpg"
              alt="AI 魔法绘本"
              className="max-w-full max-h-[min(70vh,520px)] w-auto h-auto object-contain"
            />
          </div>
          <Link href="/create" className="kid-btn-primary w-full max-w-sm text-center block">
            开始创作
          </Link>
        </div>
      </main>
    </div>
  );
}
