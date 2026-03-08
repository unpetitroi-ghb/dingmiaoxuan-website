import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

const COOKIE_NAME = 'admin_session';
const DEFAULT_PASSWORD = '123456';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function getSecret(): string {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'change-me-in-production';
}

function getExpectedPassword(): string {
  return process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
}

function sign(value: string): string {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('hex');
}

export function createAdminSession(): string {
  const expiry = String(Date.now() + SESSION_TTL_MS);
  const token = expiry + '.' + sign(expiry + 'admin');
  return token;
}

export function verifyAdminSession(token: string | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  const [expiryStr, sig] = token.split('.');
  if (!expiryStr || !sig) return false;
  const expiry = parseInt(expiryStr, 10);
  if (Number.isNaN(expiry) || expiry < Date.now()) return false;
  const expected = sign(expiryStr + 'admin');
  const sigBuf = Buffer.from(sig, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export function getAdminSessionFromRequest(req: NextApiRequest): string | undefined {
  const cookie = req.headers.cookie;
  if (!cookie) return undefined;
  const match = cookie.match(new RegExp(`(?:^|;)\\s*${COOKIE_NAME}=([^;]+)`));
  return match?.[1]?.trim();
}

export function setAdminSessionCookie(res: NextApiResponse, token: string): void {
  res.setHeader('Set-Cookie', [
    `${COOKIE_NAME}=${token}; Path=/; Max-Age=${SESSION_TTL_MS / 1000}; HttpOnly; SameSite=Lax`,
  ].join(''));
}

export function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse
): boolean {
  const token = getAdminSessionFromRequest(req);
  if (!verifyAdminSession(token)) {
    res.status(401).json({ error: '未登录或已过期' });
    return false;
  }
  return true;
}

export function checkPassword(password: string): boolean {
  return password === getExpectedPassword();
}
