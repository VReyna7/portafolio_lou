import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { StudioStore } from './store';
import { UiIcon } from './ui-icon';

/** Photo or video picker with a preview. Emits the uploaded public URL, or `cleared`. */
@Component({
  selector: 'app-file-field',
  imports: [UiIcon],
  template: `
    <div class="file">
      <span class="file__label">{{ label() }}</span>
      <label class="file__drop" [class.is-loading]="loading()">
        @if (value() && kind() === 'image') {
          <img class="file__preview" [src]="value()" alt="" />
        } @else if (value()) {
          <span class="file__ready"><app-ui-icon name="video" /> Video listo</span>
        } @else {
          <span class="file__empty">
            <app-ui-icon [name]="kind() === 'video' ? 'video' : 'image'" />
            <span>{{ hint() }}</span>
          </span>
        }
        <input
          class="file__input"
          type="file"
          [accept]="accept()"
          [attr.aria-label]="label() + (value() ? ': cambiar archivo' : ': elegir archivo')"
          [disabled]="loading()"
          (change)="pick($event)"
        />
        <span class="file__cta">{{ loading() ? 'Subiendo...' : value() ? 'Cambiar' : 'Elegir archivo' }}</span>
      </label>
      @if (value()) {
        <button type="button" class="file__remove" (click)="cleared.emit()">Quitar</button>
      }
    </div>
  `,
  styleUrl: './file-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileField {
  private readonly store = inject(StudioStore);

  readonly label = input.required<string>();
  readonly value = input('');
  readonly kind = input<'image' | 'video'>('image');
  readonly hint = input('Toca para elegir una foto');
  readonly accept = input('image/jpeg,image/png,image/webp,image/gif');

  readonly picked = output<string>();
  readonly cleared = output<void>();

  protected readonly loading = signal(false);

  protected async pick(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.loading.set(true);
    await this.store.attach(file, (url) => this.picked.emit(url));
    this.loading.set(false);
  }
}
