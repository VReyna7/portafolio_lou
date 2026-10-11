import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  signal,
  viewChild
} from '@angular/core';
import { gsap, prefersReducedMotion } from '../../animations/gsap';
import { Reveal } from '../../animations/reveal.directive';
import { Certification, CertificationsSection } from '../../models/site-content';

/**
 * Closing section: diplomas laid out like papers on a desk. They drop into
 * place on scroll, straighten on hover and open full size in a <dialog>.
 */
@Component({
  selector: 'app-certifications',
  imports: [Reveal, NgTemplateOutlet],
  templateUrl: './certifications.html',
  styleUrl: './certifications.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Certifications {
  readonly certifications = input.required<CertificationsSection>();

  protected readonly selected = signal<Certification | null>(null);
  private readonly viewer = viewChild.required<ElementRef<HTMLDialogElement>>('viewer');

  constructor() {
    const host: HTMLElement = inject(ElementRef).nativeElement;
    let ctx: gsap.Context | undefined;

    afterNextRender(() => {
      if (prefersReducedMotion()) {
        return;
      }
      // Animates the <li>, while the resting tilt lives on the inner paper via CSS `rotate`,
      // so GSAP transforms and the hover effect never fight over the same property.
      ctx = gsap.context(() => {
        gsap.from('.diploma', {
          y: -160,
          rotation: (index: number) => (index % 2 === 0 ? -18 : 18),
          autoAlpha: 0,
          duration: 1.1,
          ease: 'back.out(1.3)',
          stagger: 0.18,
          clearProps: 'transform',
          scrollTrigger: { trigger: '.diplomas', start: 'top 85%', once: true }
        });
      }, host);
    });

    inject(DestroyRef).onDestroy(() => ctx?.revert());
  }

  protected open(item: Certification): void {
    this.selected.set(item);
    const dialog = this.viewer().nativeElement;
    dialog.showModal();
    if (!prefersReducedMotion()) {
      gsap.fromTo(dialog, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'power3.out' });
    }
  }

  protected close(): void {
    this.viewer().nativeElement.close();
  }

  /** Closes when the click lands on the backdrop, not on the diploma. */
  protected onViewerClick(event: MouseEvent): void {
    if (event.target === this.viewer().nativeElement) {
      this.close();
    }
  }
}
