import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { gsap, prefersReducedMotion } from '../../animations/gsap';
import { Project } from '../../models/site-content';

/** Max wait for evidence images before starting scroll animations anyway. */
const IMAGE_WAIT_MS = 1500;

/**
 * Read-only project showcase in a native <dialog>: role, description and a
 * numbered process of evidence that reveals step by step while scrolling.
 */
@Component({
  selector: 'app-project-detail',
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectDetail {
  protected readonly project = signal<Project | null>(null);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly injector = inject(Injector);
  private ctx?: gsap.Context;
  private closing = false;

  open(project: Project): void {
    const dialog = this.dialog().nativeElement;
    this.reset(dialog);
    this.project.set(project);
    dialog.showModal();
    dialog.scrollTop = 0;

    // Wait for the project to render before animating its content.
    afterNextRender(() => void this.animateIn(dialog), { injector: this.injector });
  }

  protected close(): void {
    const dialog = this.dialog().nativeElement;
    if (!dialog.open || this.closing) {
      return;
    }
    if (prefersReducedMotion()) {
      dialog.close();
      return;
    }

    this.closing = true;
    gsap.to(dialog, {
      autoAlpha: 0,
      y: 32,
      scale: 0.97,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => dialog.close()
    });
  }

  /** Runs for every close path (button, backdrop, Escape) via the native `close` event. */
  protected onClosed(): void {
    this.reset(this.dialog().nativeElement);
    this.project.set(null);
  }

  /** Escape fires `cancel`; route it through close() so it also animates out. */
  protected onCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }

  /** Closes when the click lands on the backdrop, not inside the panel. */
  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }

  protected number(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  private reset(dialog: HTMLDialogElement): void {
    this.ctx?.revert();
    this.ctx = undefined;
    this.closing = false;
    gsap.killTweensOf(dialog);
    gsap.set(dialog, { clearProps: 'all' });
  }

  private async animateIn(dialog: HTMLDialogElement): Promise<void> {
    if (prefersReducedMotion()) {
      return;
    }

    const ctx = gsap.context(() => {}, dialog);
    this.ctx = ctx;

    let intro!: gsap.core.Timeline;
    ctx.add(() => {
      // Steps stay hidden until their own scroll trigger reveals them.
      gsap.set('.step', { autoAlpha: 0 });

      intro = gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .fromTo(
          dialog,
          { autoAlpha: 0, y: 48, scale: 0.96 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, clearProps: 'transform' }
        )
        .from('.detail__hero', { clipPath: 'inset(0 0 100% 0)', duration: 0.7 }, '-=0.2')
        .from('.detail__hero > *', { y: 30, autoAlpha: 0, stagger: 0.08, duration: 0.6 }, '-=0.4')
        .from('.detail__block', { y: 24, autoAlpha: 0, stagger: 0.1, duration: 0.5 }, '-=0.3');
    });

    // Scroll positions are only reliable once images have size and the dialog stopped scaling.
    await Promise.all([this.waitForImages(dialog), intro.then()]);
    if (this.ctx !== ctx || !dialog.open) {
      return;
    }

    ctx.add(() => {
      gsap.fromTo(
        '.detail__progress',
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: '.detail__panel',
            scroller: dialog,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.3
          }
        }
      );

      dialog.querySelectorAll<HTMLElement>('.step').forEach((step, index) => {
        const fromLeft = index % 2 === 0;
        gsap
          .timeline({
            defaults: { ease: 'power3.out' },
            scrollTrigger: { trigger: step, scroller: dialog, start: 'top 85%', once: true }
          })
          .set(step, { autoAlpha: 1 })
          .from(step.querySelector('.step__media'), {
            clipPath: fromLeft ? 'inset(0 100% 0 0 round 20px)' : 'inset(0 0 0 100% round 20px)',
            duration: 0.9
          })
          .from(step.querySelector('.step__media > *'), { scale: 1.25, duration: 1.2 }, '<')
          .from(step.querySelector('.step__number'), { y: 40, autoAlpha: 0, duration: 0.6 }, '-=0.9')
          .from(
            step.querySelectorAll('.step__title, .step__description'),
            { x: fromLeft ? 30 : -30, autoAlpha: 0, stagger: 0.1, duration: 0.5 },
            '-=0.6'
          );
      });
    });
  }

  private waitForImages(dialog: HTMLDialogElement): Promise<unknown> {
    const decodes = Array.from(dialog.querySelectorAll('img')).map((img) =>
      img.decode().catch(() => undefined)
    );
    const timeout = new Promise((resolve) => setTimeout(resolve, IMAGE_WAIT_MS));
    return Promise.race([Promise.all(decodes), timeout]);
  }
}
