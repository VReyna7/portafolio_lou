import { parseOverlay, type Overlay } from './overlay.js';
import { originOf } from './http.js';
import { OVERLAY_PATH, readText, writeText } from './store.js';

export interface PublishedContent {
  profile: unknown;
  tools: unknown;
  projects: unknown;
  contact: { web3formsKey?: string };
  certifications?: unknown;
  experience?: unknown;
}

/** The git file remains the base for profile, tools and contact on every deploy. */
export async function readBase(request: Request): Promise<PublishedContent> {
  const response = await fetch(new URL('/content/site.json', originOf(request)));
  if (!response.ok) {
    throw new Error(`base content ${response.status}`);
  }
  return (await response.json()) as PublishedContent;
}

export async function readOverlay(): Promise<{ overlay: Overlay | null; invalid: boolean }> {
  const stored = await readText(OVERLAY_PATH);
  if (!stored) {
    return { overlay: null, invalid: false };
  }
  try {
    const parsed = parseOverlay(JSON.parse(stored.text));
    if (!parsed.ok) {
      return { overlay: null, invalid: true };
    }
    return { overlay: parsed.value, invalid: false };
  } catch {
    return { overlay: null, invalid: true };
  }
}

export function mergeContent(base: PublishedContent, overlay: Overlay | null): PublishedContent {
  if (!overlay) {
    return base;
  }
  return {
    ...base,
    projects: overlay.projects,
    certifications: overlay.certifications,
    experience: overlay.experience,
  };
}

export async function writeOverlay(overlay: Overlay): Promise<void> {
  await writeText(OVERLAY_PATH, JSON.stringify(overlay), 'application/json');
}

export function web3Key(content: PublishedContent): string | null {
  const fromEnv = process.env['WEB3FORMS_KEY']?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  const key = content.contact?.web3formsKey?.trim();
  return key || null;
}
