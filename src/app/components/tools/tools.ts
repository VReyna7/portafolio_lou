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
      ctx = gsap.context(() => {
        gsap.from('.tool', {
          y: 28,
          autoAlpha: 0,
          duration: 0.65,
          ease: 'power3.out',
          stagger: 0.05,
          clearProps: 'transform',
          scrollTrigger: { trigger: '.tools-grid', start: 'top 82%', once: true }
        });
      }, host);
    });

    inject(DestroyRef).onDestroy(() => ctx?.revert());
  }
}
