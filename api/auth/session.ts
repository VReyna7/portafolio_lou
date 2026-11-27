import { json } from '../../server/editor/http.js';
import { clearSessionHeader, readSession } from '../../server/editor/session.js';

export async function GET(request: Request): Promise<Response> {
  const ok = await readSession(request);
  // 200 either way. A 401 here is only "not signed in yet", and the browser logs it as a failure.
  return json({ ok });
}

export async function POST(request: Request): Promise<Response> {
  return json({ ok: true }, 200, { 'set-cookie': clearSessionHeader(request) });
}
