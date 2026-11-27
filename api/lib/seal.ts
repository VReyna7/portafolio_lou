import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

function key(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

/** Encrypts JSON so a public blob path does not expose login bookkeeping. */
export function seal(secret: string, value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(secret), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, data]).toString('base64url');
}

export function unseal<T>(secret: string, payload: string): T | null {
  try {
    const raw = Buffer.from(payload, 'base64url');
    if (raw.length < 29) {
      return null;
    }
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const data = raw.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', key(secret), iv);
    decipher.setAuthTag(tag);
    const text = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
