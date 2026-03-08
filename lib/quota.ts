/**
 * 免费额度与付费墙逻辑（面向中国市场的变现）
 * - 每个访客（guest_id）免费可创作 1 本绘本，超出需付费
 * - 后续可扩展：兑换码、会员、微信支付
 */

import { randomUUID } from 'crypto';

const COOKIE_NAME = 'guest_id';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 年
export const FREE_STORY_LIMIT = parseInt(process.env.FREE_STORY_LIMIT || '10', 10);

export function getGuestIdFromCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;)\\s*${COOKIE_NAME}=([^;]+)`));
  const value = match?.[1]?.trim();
  return value && value.length >= 8 ? value : null;
}

export function createNewGuestId(): string {
  return randomUUID();
}

export function getSetCookieHeader(guestId: string, basePath = '/'): string {
  return `${COOKIE_NAME}=${guestId}; Path=${basePath}; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; HttpOnly`;
}
