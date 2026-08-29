import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = () =>
  process.env.BETTER_AUTH_SECRET ?? process.env.PREVIEW_SECRET ?? 'dev-secret';

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

/**
 * Stateless, time-limited share token for the preview renderer — an HMAC over
 * "<websiteId>.<expEpochSeconds>". No DB row; the link simply stops working
 * after `ttlSeconds`.
 */
export function signPreviewToken(
  websiteId: string,
  ttlSeconds: number,
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${websiteId}.${exp}`;
  const sig = createHmac('sha256', SECRET()).update(payload).digest();
  return `${b64url(payload)}.${b64url(sig)}`;
}

export function verifyPreviewToken(
  token: string,
): { websiteId: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  let payload: string;
  let sig: Buffer;
  try {
    payload = Buffer.from(parts[0], 'base64url').toString('utf8');
    sig = Buffer.from(parts[1], 'base64url');
  } catch {
    return null;
  }
  const expected = createHmac('sha256', SECRET()).update(payload).digest();
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) {
    return null;
  }
  const [websiteId, expStr] = payload.split('.');
  const exp = Number(expStr);
  if (!websiteId || !Number.isFinite(exp) || exp * 1000 < Date.now()) {
    return null;
  }
  return { websiteId };
}
