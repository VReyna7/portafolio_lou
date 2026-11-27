import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Reveal } from '../../animations/reveal.directive';
import { ExperienceSection } from '../../models/site-content';

/** Work history. Hidden by the page when there are no items yet. */
@Component({
  selector: 'app-experience',
  imports: [Reveal],
  templateUrl: './experience.html',
  styleUrl: './experience.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Experience {
  readonly experience = input.required<ExperienceSection>();

  protected when(start: string, end: string): string {
    if (start && end) return `${start} — ${end}`;
    if (start) return `${start} — Actual`;
    return end;
  }
}
