'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const PAYMENT_LINK = process.env.NEXT_PUBLIC_PAYMENT_LINK || '';
const WECHAT_REWARD_IMAGE = process.env.NEXT_PUBLIC_WECHAT_REWARD_IMAGE || '';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  used: number;
  limit: number;
}

export default function PaywallModal({ open, onClose, used, limit }: PaywallModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="paywall-title"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4 bg-white rounded-3xl shadow-xl border-2 border-[var(--kid-border-light)] overflow-hidden"
          >
            <div className="p-6 sm:p-8">
              <h2 id="paywall-title" className="kid-title text-xl mb-2 text-center">
                继续创作需解锁
              </h2>
              <p className="kid-muted text-center text-sm mb-6">
                您已用完 {limit} 次免费额度，付费后即可继续生成专属绘本
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between rounded-2xl bg-[var(--kid-primary-soft)]/50 border-2 border-[var(--kid-border-light)] p-4">
                  <div>
                    <p className="font-semibold text-stone-800">单本解锁</p>
                    <p className="text-sm kid-muted">9.9 元/本，即买即用</p>
                  </div>
                  <span className="text-2xl font-bold text-[var(--kid-primary)]">¥9.9</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-[var(--kid-magic-light)]/10 border-2 border-[var(--kid-magic-light)]/40 p-4">
                  <div>
                    <p className="font-semibold text-stone-800">月度会员</p>
                    <p className="text-sm kid-muted">19.9 元/月，无限本</p>
                  </div>
                  <span className="text-2xl font-bold text-[var(--kid-magic-dark)]">¥19.9</span>
                </div>
              </div>

              {PAYMENT_LINK ? (
                <a
                  href={PAYMENT_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="kid-btn-primary w-full block text-center mb-3"
                >
                  立即支付（跳转支付页）
                </a>
              ) : null}
              {WECHAT_REWARD_IMAGE ? (
                <div className="text-center mb-4">
                  <p className="kid-caption mb-2">微信扫码赞赏，付款后联系客服开通</p>
                  <img
                    src={WECHAT_REWARD_IMAGE}
                    alt="微信赞赏码"
                    className="mx-auto w-40 h-40 object-contain rounded-lg border border-[var(--kid-border-light)]"
                  />
                </div>
              ) : null}
              {!PAYMENT_LINK && !WECHAT_REWARD_IMAGE && (
                <p className="kid-caption text-center mb-4">
                  请通过微信赞赏或联系客服开通后继续使用
                </p>
              )}

              <Link href="/pricing" className="block text-center text-[var(--kid-primary)] font-medium text-sm hover:underline">
                查看定价说明
              </Link>
            </div>
            <div className="bg-[var(--kid-card-alt)] px-6 py-3 border-t border-[var(--kid-border-light)]">
              <button
                type="button"
                onClick={onClose}
                className="w-full kid-btn-secondary min-h-10"
              >
                稍后再说
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
