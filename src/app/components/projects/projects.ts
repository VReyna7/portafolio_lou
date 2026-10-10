import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  input,
  signal,
  viewChild
} from '@angular/core';
import { gsap, prefersReducedMotion } from '../../animations/gsap';
import { Reveal } from '../../animations/reveal.directive';
import { Project } from '../../models/site-content';

/**
 * Gallery of finished work. Projects are read-only showcases: the detail
 * opens in a native <dialog> on the same page, with no contact actions.
 */
@Component({
  selector: 'app-projects',
  imports: [Reveal],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Projects {
  readonly projects = input.required<Project[]>();

  protected readonly selected = signal<Project | null>(null);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly injector = inject(Injector);
  private closing = false;

  protected open(project: Project): void {
    const dialog = this.dialog().nativeElement;
    gsap.killTweensOf(dialog);
    this.closing = false;
    this.selected.set(project);
    dialog.showModal();

    // Wait for the selected project to render before animating its content.
    afterNextRender(() => this.animateIn(dialog), { injector: this.injector });
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
      onComplete: () => {
        dialog.close();
        gsap.set(dialog, { clearProps: 'all' });
        this.closing = false;
      }
    });
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

  private animateIn(dialog: HTMLDialogElement): void {
    if (prefersReducedMotion()) {
      return;
    }
    dialog.scrollTop = 0;

    gsap
      .timeline({ defaults: { ease: 'power3.out' } })
      .fromTo(
        dialog,
        { autoAlpha: 0, y: 48, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, clearProps: 'transform' }
      )
      .from(
        dialog.querySelectorAll('.detail__header > *, .detail__facts, .detail__body > *'),
        { y: 20, autoAlpha: 0, duration: 0.45, stagger: 0.05 },
        '-=0.25'
      )
      .from(
        dialog.querySelectorAll('.evidence__item'),
        { y: 24, scale: 0.94, autoAlpha: 0, duration: 0.45, stagger: 0.08 },
        '-=0.3'
      );
  }
}
