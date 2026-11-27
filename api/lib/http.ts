/** Shared responses and request helpers for the editor API. */

export const GENERIC_LOGIN_MESSAGE =
  'Si el correo es el correcto, llega un enlace en unos minutos. Ábrelo en este mismo aparato.';

const COOKIE = 'editor_session';

export function json(body: unknown, status = 200, extra?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...Object.fromEntries(new Headers(extra).entries()),
    },
  });
}

/** Same reply whether the email matched, the limit tripped, or mail is not ready. */
export function genericLogin(detail?: string): Response {
  const body: { ok: true; message: string; detail?: string } = {
    ok: true,
    message: GENERIC_LOGIN_MESSAGE,
  };
  // Local only. On Vercel (production and preview) the reply stays generic.
  if (detail && !process.env.VERCEL) {
    body.detail = detail;
  }
  return json(body);
}

export function originOf(request: Request): string {
  const configured = process.env.SITE_ORIGIN?.trim().replace(/\/$/, '');
  if (configured) {
    return configured;
  }
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') ?? 'https';
  if (!host) {
    throw new Error('missing host');
  }
  return `${proto}://${host}`;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export function isHttps(request: Request): boolean {
  return (request.headers.get('x-forwarded-proto') ?? 'https') === 'https';
}

export function sessionCookie(token: string, secure: boolean, maxAge: number): string {
  const parts = [
    `${COOKIE}=${token}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (secure) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

export function clearSessionCookie(secure: boolean): string {
  return sessionCookie('', secure, 0);
}

export function readSessionCookie(request: Request): string | null {
  const header = request.headers.get('cookie');
  if (!header) {
    return null;
  }
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}
