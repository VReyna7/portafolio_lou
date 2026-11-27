import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  viewChild
} from '@angular/core';
import { gsap, prefersReducedMotion } from '../../animations/gsap';
import { Reveal } from '../../animations/reveal.directive';
import { iconForCategory } from '../../icons/tool-icons';
import { Project } from '../../models/site-content';
import { Icon } from '../icon/icon';
import { ProjectDetail } from '../project-detail/project-detail';

/** Gallery of finished work; each card opens its read-only detail. */
@Component({
  selector: 'app-projects',
  imports: [Reveal, ProjectDetail, Icon],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Projects {
  readonly projects = input.required<Project[]>();
  protected readonly iconFor = iconForCategory;

  private readonly detail = viewChild.required(ProjectDetail);

  constructor() {
    const host: HTMLElement = inject(ElementRef).nativeElement;
    let ctx: gsap.Context | undefined;

    afterNextRender(() => {
      if (prefersReducedMotion()) {
        return;
      }
      ctx = gsap.context(() => {
        gsap.from('.card', {
          y: 48,
          autoAlpha: 0,
          duration: 0.85,
          ease: 'power3.out',
          stagger: 0.12,
          clearProps: 'transform',
          scrollTrigger: { trigger: '.gallery', start: 'top 82%', once: true }
        });
      }, host);
    });

    inject(DestroyRef).onDestroy(() => ctx?.revert());
  }

  protected open(project: Project): void {
    this.detail().open(project);
  }

  protected number(index: number): string {
    return String(index + 1).padStart(2, '0');
  }
}
