import { authSecret, issueSession, readToken, SESSION_TTL_MS } from './token';
import { clearSessionCookie, isHttps, readSessionCookie, sessionCookie } from './http';

export async function readSession(request: Request): Promise<boolean> {
  const secret = authSecret();
  const token = readSessionCookie(request);
  if (!secret || !token) {
    return false;
  }
  return readToken(secret, token, 'session') !== null;
}

export function setSessionHeader(request: Request): string {
  const secret = authSecret();
  if (!secret) {
    throw new Error('missing AUTH_SECRET');
  }
  return sessionCookie(issueSession(secret), isHttps(request), Math.floor(SESSION_TTL_MS / 1000));
}

export function clearSessionHeader(request: Request): string {
  return clearSessionCookie(isHttps(request));
}
