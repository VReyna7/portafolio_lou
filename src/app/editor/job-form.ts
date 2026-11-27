import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { valueOf } from './dom';
import { StudioStore } from './store';

@Component({
  selector: 'app-job-form',
  template: `
    @if (item(); as j) {
      <label class="field">
        <span class="field__label">Puesto</span>
        <input
          class="field__control"
          autocomplete="off"
          [value]="j.role"
          (input)="store.patch('job', index(), { role: valueOf($event) })"
        />
      </label>
      <label class="field">
        <span class="field__label">Lugar</span>
        <input
          class="field__control"
          autocomplete="off"
          [value]="j.place"
          (input)="store.patch('job', index(), { place: valueOf($event) })"
        />
      </label>
      <div class="field-row">
        <label class="field">
          <span class="field__label">Desde</span>
          <input
            class="field__control"
            autocomplete="off"
            placeholder="2024"
            [value]="j.start"
            (input)="store.patch('job', index(), { start: valueOf($event) })"
          />
        </label>
        <label class="field">
          <span class="field__label">Hasta</span>
          <input
            class="field__control"
            autocomplete="off"
            placeholder="Actual"
            [value]="j.end"
            (input)="store.patch('job', index(), { end: valueOf($event) })"
          />
        </label>
      </div>
      <p class="field__hint">Si dejas «Hasta» vacío, se muestra como trabajo actual.</p>
      <label class="field">
        <span class="field__label">Qué hiciste</span>
        <textarea
          class="field__control"
          rows="5"
          [value]="j.description"
          (input)="store.patch('job', index(), { description: valueOf($event) })"
        ></textarea>
      </label>
    }
  `,
  styleUrl: './fields.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobForm {
  protected readonly store = inject(StudioStore);
  protected readonly valueOf = valueOf;

  readonly index = input.required<number>();
  protected readonly item = computed(() => this.store.item('job', this.index()));
}
