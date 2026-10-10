import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  signal,
  viewChild
} from '@angular/core';
import { Project } from '../../models/site-content';

/**
 * Gallery of finished work. Projects are read-only showcases: the detail
 * opens in a native <dialog> on the same page, with no contact actions.
 */
@Component({
  selector: 'app-projects',
  templateUrl: './projects.html',
  styleUrl: './projects.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Projects {
  readonly projects = input.required<Project[]>();

  protected readonly selected = signal<Project | null>(null);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected open(project: Project): void {
    this.selected.set(project);
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
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
}
