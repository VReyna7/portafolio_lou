import { createHash, randomUUID } from 'node:crypto';
import { BlobPreconditionFailedError } from '@vercel/blob';
import { seal } from './seal.js';
import { RATE_PATH, USED_PATH, countRecent, createTemporaryText } from './store.js';

const IP_LIMIT = 8;
const IP_WINDOW_MS = 10 * 60 * 1000;
const MAIL_LIMIT = 5;
const MAIL_WINDOW_MS = 60 * 60 * 1000;

async function claimRate(secret: string, key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const bucket = Math.floor(now / windowMs);
  const prefixes = [
    `${RATE_PATH}${key}/${bucket}/`,
    `${RATE_PATH}${key}/${bucket - 1}/`,
  ];
  const counts = await Promise.all(
    prefixes.map((prefix) => countRecent(prefix, now - windowMs, limit)),
  );
  if (counts[0] + counts[1] >= limit) {
    return false;
  }
  await createTemporaryText(
    `${prefixes[0]}${now}-${randomUUID()}.txt`,
    seal(secret, { timestamp: now }),
  );
  return true;
}

export function hashIp(secret: string, ip: string): string {
  return createHash('sha256').update(`${secret}:${ip}`).digest('hex').slice(0, 24);
}

/** Counts an attempt from this IP. False when the IP is already over the limit. */
export async function claimIp(secret: string, ipHash: string): Promise<boolean> {
  return claimRate(secret, `ip/${ipHash}`, IP_LIMIT, IP_WINDOW_MS);
}

/** Counts an email that will actually be sent. Shared by every IP, so her inbox stays quiet. */
export async function claimMail(secret: string): Promise<boolean> {
  return claimRate(secret, 'mail', MAIL_LIMIT, MAIL_WINDOW_MS);
}

/** True the first time this link id is seen. A second open does not start a session. */
export async function consumeLink(secret: string, jti: string, exp: number): Promise<boolean> {
  try {
    await createTemporaryText(`${USED_PATH}${jti}.txt`, seal(secret, { exp }));
    return true;
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError) {
      return false;
    }
    throw error;
  }
}
