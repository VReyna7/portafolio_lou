import { ChangeDetectionStrategy, Component, input, viewChild } from '@angular/core';
import { Reveal } from '../../animations/reveal.directive';
import { Project } from '../../models/site-content';
import { ProjectDetail } from '../project-detail/project-detail';

/** Gallery of finished work; each card opens its read-only detail. */
@Component({
  selector: 'app-projects',
  imports: [Reveal, ProjectDetail],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Projects {
  readonly projects = input.required<Project[]>();

  private readonly detail = viewChild.required(ProjectDetail);

  protected open(project: Project): void {
    this.detail().open(project);
  }

  protected number(index: number): string {
    return String(index + 1).padStart(2, '0');
  }
}
