import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

let previewMode = false;

/**
 * The studio renders the real sections inside its own scroll container, where window-based
 * ScrollTrigger never fires. While it is open, the site's entrance animations are skipped.
 */
export function setPreviewMode(on: boolean): void {
  previewMode = on;
}

/** The OS-level preference only; used by the studio's own animations. */
export function systemReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Animations are skipped for visitors who ask the OS for less motion, and inside the studio preview. */
export function prefersReducedMotion(): boolean {
  return previewMode || systemReducedMotion();
}

export { gsap, ScrollTrigger, SplitText };
