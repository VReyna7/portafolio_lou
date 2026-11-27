import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  ViewEncapsulation,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { gsap, systemReducedMotion } from '../animations/gsap';
import { Certifications } from '../components/certifications/certifications';
import { Experience } from '../components/experience/experience';
import { Projects } from '../components/projects/projects';
import { ItemKind, SectionKind, StudioStore, Target } from './store';
import { UiIcon } from './ui-icon';

export type PreviewSection = 'projects' | 'experience' | 'diplomas';

const NAMES: Record<ItemKind, string> = { project: 'proyecto', diploma: 'diplomado', job: 'experiencia' };
const NAME_SELECTOR = '.card__title, .diploma__title, .job__role';

/**
 * Renders the real site sections from the draft, so every edit is visible immediately.
 * Clicks are intercepted in the capture phase: instead of opening the site's own modal,
 * they select the item for the side panel. The host itself is the scroll container.
 */
@Component({
  selector: 'app-studio-preview',
  imports: [Projects, Experience, Certifications, UiIcon],
  templateUrl: './studio-preview.html',
  styleUrl: './studio-preview.css',
  // None: the selection outlines must reach elements that belong to the site's own components.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.padding-bottom.px]': 'store.overlay() + 24',
    '(scroll)': 'onScroll()',
  },
})
export class StudioPreview {
  readonly store = inject(StudioStore);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly injector = inject(Injector);

  protected readonly site = computed(() => this.store.draft());
  /** The section currently nearest the top; the tabs highlight it. */
  readonly current = signal<PreviewSection>('projects');

  private pickedKey = '';
  private lastTarget: Target | null = null;
  private introDone = false;
  private scrollFrame = 0;
  private revealTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    afterNextRender(() => {
      this.host.addEventListener('click', this.onClick, true);
      this.host.addEventListener('keydown', this.onKey);
    });
    inject(DestroyRef).onDestroy(() => {
      this.host.removeEventListener('click', this.onClick, true);
      this.host.removeEventListener('keydown', this.onKey);
      cancelAnimationFrame(this.scrollFrame);
      clearTimeout(this.revealTimer);
    });

    // After every render, re-mark the selected element (the site's components may have recreated it).
    effect(() => {
      this.store.draft();
      const target = this.store.target();
      afterNextRender(() => this.decorate(target), { injector: this.injector });
    });

    effect(() => {
      if (this.store.focusPicked() === 0) return;
      afterNextRender(() => this.focusLast(), { injector: this.injector });
    });
  }

  scrollTo(section: PreviewSection): void {
    const block = this.host.querySelector<HTMLElement>(`[data-block="${section}"]`);
    if (!block) return;
    this.current.set(section);
    const top = this.host.scrollTop + block.getBoundingClientRect().top - this.host.getBoundingClientRect().top;
    this.host.scrollTo({ top: top - 8, behavior: systemReducedMotion() ? 'auto' : 'smooth' });
  }

  protected add(kind: ItemKind): void {
    this.store.add(kind);
  }

  protected editSection(kind: SectionKind): void {
    this.store.select({ kind, index: 0 }, true);
  }

  protected onScroll(): void {
    if (this.scrollFrame) return;
    this.scrollFrame = requestAnimationFrame(() => {
      this.scrollFrame = 0;
      const hostTop = this.host.getBoundingClientRect().top;
      let active: PreviewSection = 'projects';
      for (const block of this.host.querySelectorAll<HTMLElement>('[data-block]')) {
        if (block.getBoundingClientRect().top - hostTop <= 160) active = block.dataset['block'] as PreviewSection;
      }
      this.current.set(active);
    });
  }

  private readonly onClick = (event: MouseEvent): void => {
    const el = (event.target as Element | null)?.closest<HTMLElement>('[data-edit]');
    if (!el || !this.host.contains(el)) return;
    event.preventDefault();
    event.stopPropagation();
    // detail is 0 for clicks synthesized by the keyboard, which should move focus into the panel.
    this.store.select(this.targetOf(el), event.detail === 0);
  };

  private readonly onKey = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const el = event.target as HTMLElement;
    if (!el.matches('[data-edit]') || el instanceof HTMLButtonElement) return;
    event.preventDefault();
    this.store.select(this.targetOf(el), true);
  };

  private targetOf(el: HTMLElement): Target {
    return { kind: el.dataset['edit'] as ItemKind, index: Number(el.dataset['index']) };
  }

  private decorate(target: Target | null): void {
    const items = Array.from(this.host.querySelectorAll<HTMLElement>('[data-edit]'));
    for (const el of items) {
      const item = this.targetOf(el);
      const picked = !!target && item.kind === target.kind && item.index === target.index;
      el.classList.toggle('is-picked', picked);
      if (picked) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
      this.label(el, item.kind as ItemKind);
    }

    if (!this.introDone && items.length) {
      this.introDone = true;
      this.intro(items);
    }

    if (!target) {
      this.pickedKey = '';
      return;
    }
    this.lastTarget = target;
    const key = `${target.kind}:${target.index}`;
    if (key === this.pickedKey) return;
    this.pickedKey = key;
    const el = items.find((candidate) => candidate.classList.contains('is-picked'));
    if (!el) return;
    // The sheet and the preview's bottom padding settle on the next frame.
    clearTimeout(this.revealTimer);
    this.revealTimer = setTimeout(() => this.reveal(el), 60);
  }

  /** Makes each editable element reachable by keyboard and named for screen readers. */
  private label(el: HTMLElement, kind: ItemKind): void {
    const control = el instanceof HTMLButtonElement ? el : (el.querySelector('button') ?? el);
    const name = el.querySelector(NAME_SELECTOR)?.textContent?.trim() || 'sin nombre';
    control.setAttribute('aria-label', `Editar ${NAMES[kind]}: ${name}`);
    if (control === el && !(el instanceof HTMLButtonElement)) {
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
    }
  }

  private intro(items: HTMLElement[]): void {
    if (systemReducedMotion()) return;
    gsap.from(items, {
      y: 22,
      autoAlpha: 0,
      duration: 0.5,
      stagger: 0.06,
      ease: 'power2.out',
      clearProps: 'transform,opacity,visibility',
    });
  }

  /** Scrolls the item into the part of the preview the sheet does not cover, then pulses its outline. */
  private reveal(el: HTMLElement): void {
    if (!el.isConnected) return;
    const margin = 16;
    const hostRect = this.host.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const visibleBottom = hostRect.bottom - this.store.overlay();
    const inView = rect.top >= hostRect.top + margin && rect.bottom <= visibleBottom - margin;
    if (!inView) {
      this.host.scrollTo({
        top: this.host.scrollTop + rect.top - hostRect.top - margin,
        behavior: systemReducedMotion() ? 'auto' : 'smooth',
      });
    }
    if (!systemReducedMotion()) {
      gsap.fromTo(el, { outlineOffset: 16 }, { outlineOffset: 4, duration: 0.55, ease: 'back.out(2)', clearProps: 'outlineOffset' });
    }
  }

  private focusLast(): void {
    const target = this.lastTarget;
    if (!target) return;
    const el = this.host.querySelector<HTMLElement>(`[data-edit="${target.kind}"][data-index="${target.index}"]`);
    const control = el instanceof HTMLButtonElement ? el : (el?.querySelector('button') ?? el);
    control?.focus({ preventScroll: true });
  }
}
