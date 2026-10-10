import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';
import { gsap, prefersReducedMotion } from './gsap';

/**
 * Fades and lifts content into view the first time its section scrolls in.
 * Pass a selector to stagger matching children instead of the host itself:
 * <section appReveal=".title, .card">.
 */
@Directive({ selector: '[appReveal]' })
export class Reveal {
  readonly appReveal = input('');

  constructor() {
    const host: HTMLElement = inject(ElementRef).nativeElement;
    let ctx: gsap.Context | undefined;

    afterNextRender(() => {
      if (prefersReducedMotion()) {
        return;
      }
      const selector = this.appReveal();
      const targets = selector ? host.querySelectorAll(selector) : host;

      ctx = gsap.context(() => {
        gsap.from(targets, {
          y: 40,
          autoAlpha: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.07,
          clearProps: 'transform',
          scrollTrigger: { trigger: host, start: 'top 82%', once: true }
        });
      }, host);
    });

    inject(DestroyRef).onDestroy(() => ctx?.revert());
  }
}
