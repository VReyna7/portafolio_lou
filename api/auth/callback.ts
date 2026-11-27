import { consumeLink } from '../../server/editor/guard';
import { originOf } from '../../server/editor/http';
import { setSessionHeader } from '../../server/editor/session';
import { authSecret, readToken } from '../../server/editor/token';

/** Email links land here. The token never continues into the editor URL. */
export async function GET(request: Request): Promise<Response> {
  const secret = authSecret();
  const token = new URL(request.url).searchParams.get('token') ?? '';
  const payload = secret ? readToken(secret, token, 'link') : null;
  if (!secret || !payload?.jti) {
    return redirect(request, '/estudio?aviso=enlace');
  }
  try {
    const fresh = await consumeLink(secret, payload.jti, payload.exp);
    if (!fresh) {
      return redirect(request, '/estudio?aviso=enlace');
    }
  } catch (error) {
    console.error('login consume failed', error);
    return redirect(request, '/estudio?aviso=error');
  }
  return redirect(request, '/estudio', setSessionHeader(request));
}

function redirect(request: Request, path: string, cookie?: string): Response {
  const headers = new Headers({
    location: new URL(path, originOf(request)).toString(),
    'cache-control': 'no-store',
    'referrer-policy': 'no-referrer',
  });
  if (cookie) {
    headers.set('set-cookie', cookie);
  }
  return new Response(null, { status: 302, headers });
}
