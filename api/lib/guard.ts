import { createHash } from 'node:crypto';
import { seal, unseal } from './seal';
import { RATE_PATH, USED_PATH, readText, writeText } from './store';

const IP_LIMIT = 8;
const IP_WINDOW_MS = 10 * 60 * 1000;
const MAIL_LIMIT = 5;
const MAIL_WINDOW_MS = 60 * 60 * 1000;

interface RateState {
  hits: Record<string, number[]>;
}

interface UsedState {
  links: { jti: string; exp: number }[];
}

async function updateSealed<T>(pathname: string, secret: string, update: (current: T | null) => T): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await readText(pathname);
    const parsed = current ? unseal<T>(secret, current.text) : null;
    const next = seal(secret, update(parsed));
    try {
      await writeText(pathname, next, 'text/plain', current?.etag);
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function prune(list: number[] | undefined, now: number, windowMs: number): number[] {
  return (list ?? []).filter((stamp) => now - stamp < windowMs);
}

export function hashIp(secret: string, ip: string): string {
  return createHash('sha256').update(`${secret}:${ip}`).digest('hex').slice(0, 24);
}

/** Counts an attempt from this IP. False when the IP is already over the limit. */
export async function claimIp(secret: string, ipHash: string): Promise<boolean> {
  let allowed = false;
  await updateSealed<RateState>(RATE_PATH, secret, (current) => {
    const now = Date.now();
    const hits = { ...(current?.hits ?? {}) };
    const ipHits = prune(hits[ipHash], now, IP_WINDOW_MS);
    if (ipHits.length >= IP_LIMIT) {
      allowed = false;
      hits[ipHash] = ipHits;
      return { hits };
    }
    allowed = true;
    hits[ipHash] = [...ipHits, now];
    return { hits };
  });
  return allowed;
}

/** Counts an email that will actually be sent. Shared by every IP, so her inbox stays quiet. */
export async function claimMail(secret: string): Promise<boolean> {
  let allowed = false;
  await updateSealed<RateState>(RATE_PATH, secret, (current) => {
    const now = Date.now();
    const hits = { ...(current?.hits ?? {}) };
    const mailHits = prune(hits['mail'], now, MAIL_WINDOW_MS);
    if (mailHits.length >= MAIL_LIMIT) {
      allowed = false;
      hits['mail'] = mailHits;
      return { hits };
    }
    allowed = true;
    hits['mail'] = [...mailHits, now];
    return { hits };
  });
  return allowed;
}

/** True the first time this link id is seen. A second open does not start a session. */
export async function consumeLink(secret: string, jti: string, exp: number): Promise<boolean> {
  let fresh = false;
  await updateSealed<UsedState>(USED_PATH, secret, (current) => {
    const now = Date.now();
    const links = (current?.links ?? []).filter((link) => link.exp > now);
    if (links.some((link) => link.jti === jti)) {
      fresh = false;
      return { links };
    }
    fresh = true;
    return { links: [...links, { jti, exp }] };
  });
  return fresh;
}
