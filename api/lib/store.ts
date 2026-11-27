import { get, put } from '@vercel/blob';

/**
 * One public Blob store holds media and these bookkeeping files.
 * Login state is sealed before it is written; the overlay is public content.
 */
export const OVERLAY_PATH = 'editor/overlay.json';
export const RATE_PATH = 'editor/rate.txt';
export const USED_PATH = 'editor/used.txt';

interface StoredText {
  text: string;
  etag: string;
}

export async function readText(pathname: string): Promise<StoredText | null> {
  const result = await get(pathname, { access: 'public', useCache: false });
  if (!result || result.statusCode !== 200) {
    return null;
  }
  return { text: await new Response(result.stream).text(), etag: result.blob.etag };
}

export async function writeText(
  pathname: string,
  body: string,
  contentType: string,
  etag?: string,
): Promise<void> {
  await put(pathname, body, {
    access: 'public',
    allowOverwrite: true,
    contentType,
    cacheControlMaxAge: 60,
    ...(etag ? { ifMatch: etag } : {}),
  });
}
