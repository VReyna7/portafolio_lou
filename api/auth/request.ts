import { claimIp, claimMail, hashIp } from '../../server/editor/guard.js';
import { clientIp, genericLogin, originOf } from '../../server/editor/http.js';
import { sendLoginLink } from '../../server/editor/mail.js';
import { readBase, web3Key } from '../../server/editor/publish.js';
import { authSecret, issueLink } from '../../server/editor/token.js';

/** Lourdes comes from EDITOR_EMAIL. This address can always request a link for tests. */
const DEVELOPER_EMAIL = 'veduardo239@gmail.com';

function editorEmails(): string[] {
  const configured = (process.env['EDITOR_EMAIL'] ?? '')
    .split(/[,;]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...configured, DEVELOPER_EMAIL])];
}

export async function POST(request: Request): Promise<Response> {
  try {
    return await handle(request);
  } catch (error) {
    console.error('login request failed', error);
    return genericLogin('unexpected');
  }
}

async function handle(request: Request): Promise<Response> {
  const raw = await request.text();
  if (raw.length > 1000) {
    return genericLogin('body');
  }
  let email = '';
  try {
    const body = JSON.parse(raw) as { email?: unknown };
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  } catch {
    return genericLogin('json');
  }

  const secret = authSecret();
  const allowed = editorEmails();
  if (!secret || allowed.length === 0) {
    console.error('editor login is missing AUTH_SECRET');
    return genericLogin('config');
  }

  let ipAllowed = false;
  try {
    ipAllowed = await claimIp(secret, hashIp(secret, clientIp(request)));
  } catch (error) {
    console.error('login rate storage failed', error);
    return genericLogin('storage');
  }
  const known = allowed.includes(email);
  if (!ipAllowed || !known) {
    return genericLogin(known ? 'rate' : 'email');
  }

  let mailAllowed = false;
  try {
    mailAllowed = await claimMail(secret);
  } catch (error) {
    console.error('login mail quota failed', error);
    return genericLogin('storage');
  }
  if (!mailAllowed) {
    return genericLogin('mail-rate');
  }

  const { token } = issueLink(secret);
  const link = `${originOf(request)}/api/auth/callback?token=${encodeURIComponent(token)}`;
  try {
    const base = await readBase(request);
    await sendLoginLink(email, link, web3Key(base));
  } catch (error) {
    console.error('login mail failed', error);
    return genericLogin('mail');
  }
  return genericLogin();
}
