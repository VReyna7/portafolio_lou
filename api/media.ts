import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { json } from '../server/editor/http.js';
import { readSession } from '../server/editor/session.js';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/quicktime',
];

const MAX_BYTES = 25 * 1024 * 1024;

/**
 * Browser uploads talk to Blob directly. This route only hands out a token
 * after the editor session is valid, so the 4.5 MB function limit does not apply.
 */
export async function POST(request: Request): Promise<Response> {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return json({ error: 'No se pudo leer el archivo.' }, 400);
  }
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await readSession(request))) {
          throw new Error('unauthorized');
        }
        if (!pathname.startsWith('media/') || pathname.includes('..')) {
          throw new Error('path');
        }
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
          allowOverwrite: false,
        };
      },
    });
    return json(result);
  } catch (error) {
    console.error('media token failed', error);
    const message = error instanceof Error && error.message === 'unauthorized'
      ? 'La sesión venció. Pide otro enlace.'
      : 'No se pudo subir el archivo.';
    return json({ error: message }, message.startsWith('La sesión') ? 401 : 400);
  }
}
