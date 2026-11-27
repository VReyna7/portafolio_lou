import { upload } from '@vercel/blob/client';

const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/quicktime',
]);

export const MAX_MEDIA_BYTES = 25 * 1024 * 1024;

export function mediaType(file: File): string {
  if (file.type && ALLOWED.has(file.type)) {
    return file.type;
  }
  const extension = file.name.split('.').pop()?.toLowerCase();
  const byExtension: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    heic: 'image/heic',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
  };
  return (extension && byExtension[extension]) || '';
}

export async function uploadMedia(file: File): Promise<string> {
  const type = mediaType(file);
  if (!ALLOWED.has(type)) {
    throw new Error('Usa una foto JPG, PNG o WEBP, o un video MP4.');
  }
  if (file.size > MAX_MEDIA_BYTES) {
    throw new Error('El archivo pasa de 25 MB. Comprime el video antes de subirlo.');
  }
  const safe = file.name.split(/[/\\]/).pop()?.replace(/[^a-zA-Z0-9._-]/g, '') || 'archivo';
  const blob = await upload(`media/${safe}`, file, {
    access: 'public',
    handleUploadUrl: '/api/media',
    contentType: type,
  });
  return blob.url;
}
