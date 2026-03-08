import Head from 'next/head';
import Link from 'next/link';

const PAYMENT_LINK = process.env.NEXT_PUBLIC_PAYMENT_LINK || '';
const WECHAT_REWARD_IMAGE = process.env.NEXT_PUBLIC_WECHAT_REWARD_IMAGE || '';

export default function PricingPage() {
  return (
    <>
      <Head>
        <title>定价与解锁 - AI 魔法绘本</title>
        <meta name="description" content="免费体验 10 本，单本 9.9 元，会员 19.9 元/月 无限创作" />
      </Head>
      <div className="kid-page min-h-screen">
        <div className="mx-auto max-w-lg px-4 py-10">
          <h1 className="kid-title text-2xl sm:text-3xl text-center mb-2">定价与解锁</h1>
          <p className="kid-muted text-center mb-8">先免费体验 10 本，满意再付费</p>

          <div className="kid-card space-y-6 mb-8">
            <div className="rounded-2xl bg-[var(--kid-primary-soft)]/50 border-2 border-[var(--kid-border-light)] p-5">
              <p className="font-semibold text-lg text-stone-800 mb-1">免费体验</p>
              <p className="kid-muted text-sm mb-2">每台设备可免费创作 10 本完整绘本</p>
              <p className="text-2xl font-bold text-[var(--kid-primary)]">¥0</p>
            </div>
            <div className="rounded-2xl bg-white border-2 border-[var(--kid-border-light)] p-5">
              <p className="font-semibold text-lg text-stone-800 mb-1">单本解锁</p>
              <p className="kid-muted text-sm mb-2">用完免费额度后，按本付费，即买即用</p>
              <p className="text-2xl font-bold text-[var(--kid-primary)]">¥9.9 <span className="text-base font-normal kid-muted">/ 本</span></p>
            </div>
            <div className="rounded-2xl bg-[var(--kid-magic-light)]/10 border-2 border-[var(--kid-magic-light)]/40 p-5">
              <p className="font-semibold text-lg text-stone-800 mb-1">月度会员</p>
              <p className="kid-muted text-sm mb-2">当月无限本，适合多娃家庭或频繁创作</p>
              <p className="text-2xl font-bold text-[var(--kid-magic-dark)]">¥19.9 <span className="text-base font-normal kid-muted">/ 月</span></p>
            </div>
          </div>

          {PAYMENT_LINK ? (
            <a
              href={PAYMENT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="kid-btn-primary w-full block text-center py-4 rounded-2xl mb-4"
            >
              立即支付 / 开通会员
            </a>
          ) : null}
          {WECHAT_REWARD_IMAGE ? (
            <div className="text-center mb-6 kid-card">
              <p className="font-semibold text-stone-800 mb-2">微信扫码赞赏</p>
              <p className="kid-caption mb-3">付款后请截图并联系客服开通（客服微信见页脚）</p>
              <img
                src={WECHAT_REWARD_IMAGE}
                alt="微信赞赏码"
                className="mx-auto w-44 h-44 object-contain rounded-xl border border-[var(--kid-border-light)]"
              />
            </div>
          ) : null}
          {!PAYMENT_LINK && !WECHAT_REWARD_IMAGE && (
            <div className="kid-card text-center">
              <p className="kid-muted text-sm">支付通道配置中，请暂通过微信联系客服开通</p>
            </div>
          )}

          <div className="text-center mt-8">
            <Link href="/create" className="kid-btn-secondary inline-block">
              返回创作
            </Link>
            <span className="mx-3 kid-muted">|</span>
            <Link href="/" className="text-[var(--kid-primary)] font-medium hover:underline">
              回首页
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
