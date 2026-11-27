import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input
} from '@angular/core';
import { gsap, prefersReducedMotion } from '../../animations/gsap';
import { Reveal } from '../../animations/reveal.directive';
import { iconForArea } from '../../icons/tool-icons';
import { ToolsSection } from '../../models/site-content';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-tools',
  imports: [Reveal, Icon],
  templateUrl: './tools.html',
  styleUrl: './tools.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Tools {
  readonly tools = input.required<ToolsSection>();
  protected readonly iconFor = iconForArea;

  constructor() {
    const host: HTMLElement = inject(ElementRef).nativeElement;
    let ctx: gsap.Context | undefined;

    afterNextRender(() => {
      if (prefersReducedMotion()) {
        return;
      }
      // Accent marks draw in as each row enters — more deliberate than a generic fade.
      ctx = gsap.context(() => {
        gsap.from('.tool__mark', {
          scaleY: 0,
          transformOrigin: 'top',
          duration: 0.55,
          ease: 'power2.out',
          stagger: 0.06,
          scrollTrigger: { trigger: '.tools-list', start: 'top 80%', once: true }
        });
      }, host);
    });

    inject(DestroyRef).onDestroy(() => ctx?.revert());
  }
}
