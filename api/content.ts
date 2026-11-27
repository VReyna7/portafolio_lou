import { json } from '../server/editor/http.js';
import { parseOverlay } from '../server/editor/overlay.js';
import { mergeContent, readBase, readOverlay, writeOverlay } from '../server/editor/publish.js';
import { readSession } from '../server/editor/session.js';

export async function GET(request: Request): Promise<Response> {
  try {
    const base = await readBase(request);
    let overlay = null;
    let invalid = false;
    try {
      const stored = await readOverlay();
      overlay = stored.overlay;
      invalid = stored.invalid;
    } catch (error) {
      console.error('overlay read failed', error);
    }
    return json(mergeContent(base, invalid ? null : overlay), 200, {
      'x-content-overlay': invalid ? 'invalid' : overlay ? 'ok' : 'missing',
    });
  } catch (error) {
    console.error('content read failed', error);
    return json({ error: 'No se pudo leer el contenido.' }, 500);
  }
}

export async function PUT(request: Request): Promise<Response> {
  if (!(await readSession(request))) {
    return json({ error: 'La sesión venció. Pide otro enlace.' }, 401);
  }
  const raw = await request.text();
  if (raw.length > 1_000_000) {
    return json({ error: 'El contenido es demasiado grande.' }, 413);
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'El contenido no se pudo leer.' }, 400);
  }
  const parsed = parseOverlay(body);
  if (!parsed.ok) {
    return json({ error: parsed.error }, 400);
  }
  try {
    await writeOverlay(parsed.value);
  } catch (error) {
    console.error('overlay write failed', error);
    return json(
      { error: 'No se pudo guardar. Falta conectar el almacén del sitio en Vercel.' },
      503,
    );
  }
  return json({ ok: true });
}
