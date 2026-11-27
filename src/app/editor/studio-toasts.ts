import { ChangeDetectionStrategy, Component, inject, model, output } from '@angular/core';
import { StudioStore } from './store';
import { UiIcon } from './ui-icon';

/** One message at a time, by priority: error, leave confirmation, undo, then confirmation notice. */
@Component({
  selector: 'app-studio-toasts',
  imports: [UiIcon],
  template: `
    <div class="toasts" aria-live="polite">
      @if (store.error(); as message) {
        <p class="toast toast--error" role="alert">
          <span>{{ message }}</span>
          <button type="button" (click)="store.error.set('')">Cerrar</button>
        </p>
      } @else if (leaving()) {
        <p class="toast" role="alert">
          <span>Hay cambios sin guardar.</span>
          <button type="button" (click)="leaving.set(false)">Seguir editando</button>
          <button type="button" class="toast__danger" (click)="leave.emit()">Salir sin guardar</button>
        </p>
      } @else if (store.undoText(); as message) {
        <p class="toast">
          <span>{{ message }}</span>
          <button type="button" (click)="store.undo()"><app-ui-icon name="undo" /> Deshacer</button>
        </p>
      } @else if (store.notice(); as message) {
        <p class="toast toast--ok">
          <svg class="toast__check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
          <span>{{ message }}</span>
        </p>
      }
    </div>
  `,
  styleUrl: './studio-toasts.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioToasts {
  protected readonly store = inject(StudioStore);

  /** Two-way: the editor opens the confirmation, this component can dismiss it. */
  readonly leaving = model(false);
  readonly leave = output<void>();
}
