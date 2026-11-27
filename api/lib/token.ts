import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const LINK_TTL_MS = 15 * 60 * 1000;
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface TokenPayload {
  purpose: 'link' | 'session';
  exp: number;
  jti?: string;
}

function sign(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url');
}

function issue(secret: string, payload: TokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(secret, body)}`;
}

/** Returns the payload only when the signature and expiry are valid. */
export function readToken(secret: string, token: string, purpose: TokenPayload['purpose']): TokenPayload | null {
  if (token.length > 600) {
    return null;
  }
  const dot = token.indexOf('.');
  if (dot <= 0) {
    return null;
  }
  const body = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(secret, body);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
    if (payload.purpose !== purpose || typeof payload.exp !== 'number' || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function issueLink(secret: string): { token: string; jti: string; exp: number } {
  const jti = randomBytes(16).toString('base64url');
  const exp = Date.now() + LINK_TTL_MS;
  return { token: issue(secret, { purpose: 'link', exp, jti }), jti, exp };
}

export function issueSession(secret: string): string {
  return issue(secret, { purpose: 'session', exp: Date.now() + SESSION_TTL_MS });
}

export function authSecret(): string | null {
  const secret = process.env.AUTH_SECRET?.trim();
  return secret ? secret : null;
}
