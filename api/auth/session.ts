import { json } from '../lib/http';
import { clearSessionHeader, readSession } from '../lib/session';

export async function GET(request: Request): Promise<Response> {
  const ok = await readSession(request);
  return json({ ok }, ok ? 200 : 401);
}

export async function POST(request: Request): Promise<Response> {
  return json({ ok: true }, 200, { 'set-cookie': clearSessionHeader(request) });
}
