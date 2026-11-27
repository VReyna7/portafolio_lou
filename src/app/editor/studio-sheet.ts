import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { gsap, systemReducedMotion } from '../animations/gsap';
import { DiplomaForm } from './diploma-form';
import { JobForm } from './job-form';
import { ProjectForm } from './project-form';
import { SectionForm } from './section-form';
import { ItemKind, StudioStore, Target } from './store';
import { UiIcon } from './ui-icon';

type Size = 'peek' | 'open' | 'full';

const DESKTOP = '(min-width: 960px)';
const PEEK_PX = 88;
const OPEN_RATIO = 0.58;
const FULL_RATIO = 0.92;

const EYEBROWS: Record<Target['kind'], string> = {
  project: 'Proyecto',
  diploma: 'Diplomado',
  job: 'Experiencia',
  'diplomas-section': 'Sección',
  'jobs-section': 'Sección',
};

/**
 * Bottom sheet on phones (three sizes, drag or tap the grip), side column on desktop.
 * The content stays mounted while the sheet slides out so it never flashes empty.
 */
@Component({
  selector: 'app-studio-sheet',
  imports: [UiIcon, ProjectForm, DiplomaForm, JobForm, SectionForm],
  templateUrl: './studio-sheet.html',
  styleUrl: './studio-sheet.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-open]': 'open()',
    '[attr.data-size]': 'size()',
    '[attr.inert]': "open() ? null : ''",
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class StudioSheet {
  private readonly injector = inject(Injector);
  protected readonly store = inject(StudioStore);

  protected readonly size = signal<Size>('open');
  protected readonly open = computed(() => this.store.target() !== null);
  protected readonly last = signal<Target | null>(null);

  protected readonly itemKind = computed<ItemKind | null>(() => {
    const kind = this.last()?.kind;
    return kind === 'project' || kind === 'diploma' || kind === 'job' ? kind : null;
  });
  protected readonly count = computed(() => {
    const kind = this.itemKind();
    return kind ? this.store.count(kind) : 0;
  });
  protected readonly meta = computed(() => {
    const target = this.last();
    if (!target) return null;
    const eyebrow = EYEBROWS[target.kind];
    switch (target.kind) {
      case 'project':
        return { eyebrow, title: this.store.item('project', target.index)?.title || 'Proyecto nuevo' };
      case 'diploma':
        return { eyebrow, title: this.store.item('diploma', target.index)?.title || 'Diplomado nuevo' };
      case 'job':
        return { eyebrow, title: this.store.item('job', target.index)?.role || 'Experiencia nueva' };
      case 'diplomas-section':
        return { eyebrow, title: 'Diplomados' };
      case 'jobs-section':
        return { eyebrow, title: 'Experiencia' };
    }
  });

  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly body = viewChild<ElementRef<HTMLElement>>('body');

  private startY = 0;
  private dragged = false;
  private lastKey = '';

  constructor() {
    effect(() => {
      const target = this.store.target();
      if (!target) return;
      untracked(() => {
        this.last.set(target);
        if (this.size() === 'peek') this.size.set('open');
        this.animateBody(`${target.kind}:${target.index}`);
      });
    });

    // Tell the preview how much of it the sheet covers (phones only).
    effect(() => {
      const covered =
        !this.open() || window.matchMedia(DESKTOP).matches
          ? 0
          : this.size() === 'peek'
            ? PEEK_PX
            : Math.round(window.innerHeight * (this.size() === 'open' ? OPEN_RATIO : FULL_RATIO));
      this.store.overlay.set(covered);
    });

    // Keyboard selection moves focus into the panel so it is announced.
    effect(() => {
      if (this.store.focusPanel() === 0) return;
      afterNextRender(() => this.heading()?.nativeElement.focus({ preventScroll: true }), {
        injector: this.injector,
      });
    });
  }

  protected move(direction: -1 | 1): void {
    const target = this.last();
    const kind = this.itemKind();
    if (target && kind) this.store.move(kind, target.index, direction);
  }

  protected remove(): void {
    const target = this.last();
    const kind = this.itemKind();
    if (target && kind) this.store.remove(kind, target.index);
  }

  protected close(): void {
    this.store.close(true);
  }

  protected onEscape(): void {
    if (this.open()) this.store.close(true);
  }

  protected gripDown(event: PointerEvent): void {
    this.startY = event.clientY;
    this.dragged = false;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  protected gripUp(event: PointerEvent): void {
    const delta = event.clientY - this.startY;
    if (Math.abs(delta) < 40) return;
    this.dragged = true;
    if (delta < 0) this.size.update((s) => (s === 'peek' ? 'open' : 'full'));
    else this.size.update((s) => (s === 'full' ? 'open' : 'peek'));
  }

  /** A plain tap (or Enter) cycles the size; a drag has already changed it. */
  protected gripClick(): void {
    if (this.dragged) {
      this.dragged = false;
      return;
    }
    this.size.update((s) => (s === 'open' ? 'full' : 'open'));
  }

  private animateBody(key: string): void {
    if (key === this.lastKey) return;
    this.lastKey = key;
    if (systemReducedMotion()) return;
    afterNextRender(
      () => {
        const body = this.body()?.nativeElement;
        if (body) {
          gsap.fromTo(
            body.children,
            { y: 14, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.35, stagger: 0.04, ease: 'power2.out', clearProps: 'transform,opacity,visibility' },
          );
        }
      },
      { injector: this.injector },
    );
  }
}
