import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input
} from '@angular/core';
import { SplitText, gsap, prefersReducedMotion } from '../../animations/gsap';
import { Profile } from '../../models/site-content';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.html',
  styleUrl: './hero.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Hero {
  readonly profile = input.required<Profile>();

  protected readonly initials = computed(() =>
    this.profile()
      .name.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
  );

  constructor() {
    const host: HTMLElement = inject(ElementRef).nativeElement;
    let ctx: gsap.Context | undefined;

    // Entrance timeline; the slogan is revealed word by word at the end.
    afterNextRender(() => {
      if (prefersReducedMotion()) {
        return;
      }
      ctx = gsap.context(() => {
        const quote = SplitText.create('.hero__quote-text', { type: 'words' });

        gsap
          .timeline({ defaults: { ease: 'power3.out', duration: 0.8 } })
          .from('.eyebrow, .hero__name, .hero__headline', { y: 32, autoAlpha: 0, stagger: 0.12 })
          .from('.hero__media', { scale: 0.9, rotate: -3, autoAlpha: 0, duration: 1 }, 0.15)
          .from('.hero__intro li', { x: -24, autoAlpha: 0, stagger: 0.1 }, '-=0.6')
          .from('.hero__actions .btn', { y: 20, autoAlpha: 0, stagger: 0.1 }, '-=0.5')
          .from('.hero__quote', { scaleX: 0, transformOrigin: 'left center', duration: 0.6 }, '-=0.3')
          .from(quote.words, { y: 18, autoAlpha: 0, stagger: 0.05, duration: 0.6 }, '-=0.3');
      }, host);
    });

    inject(DestroyRef).onDestroy(() => ctx?.revert());
  }
}
