import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { valueOf } from './dom';
import { FileField } from './file-field';
import { StudioStore } from './store';

@Component({
  selector: 'app-diploma-form',
  imports: [FileField],
  template: `
    @if (item(); as d) {
      <label class="field">
        <span class="field__label">Nombre del diplomado</span>
        <input
          class="field__control"
          autocomplete="off"
          [value]="d.title"
          (input)="store.patch('diploma', index(), { title: valueOf($event) })"
        />
      </label>
      <label class="field">
        <span class="field__label">Institución</span>
        <input
          class="field__control"
          autocomplete="off"
          [value]="d.issuer"
          (input)="store.patch('diploma', index(), { issuer: valueOf($event) })"
        />
      </label>
      <label class="field">
        <span class="field__label">Año</span>
        <input
          class="field__control"
          inputmode="numeric"
          autocomplete="off"
          placeholder="2025"
          [value]="d.year ?? ''"
          (input)="store.patch('diploma', index(), { year: valueOf($event) })"
        />
      </label>
      <app-file-field
        label="Foto del diploma"
        hint="Toca para elegir la foto o el escaneo"
        [value]="d.image"
        (picked)="store.patch('diploma', index(), { image: $event })"
        (cleared)="store.patch('diploma', index(), { image: '' })"
      />
    }
  `,
  styleUrl: './fields.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiplomaForm {
  protected readonly store = inject(StudioStore);
  protected readonly valueOf = valueOf;

  readonly index = input.required<number>();
  protected readonly item = computed(() => this.store.item('diploma', this.index()));
}
