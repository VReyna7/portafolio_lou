import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { valueOf } from './dom';
import { StudioStore } from './store';

/** Title and intro of the diplomas or experience section. */
@Component({
  selector: 'app-section-form',
  template: `
    @if (section(); as s) {
      <label class="field">
        <span class="field__label">Título de la sección</span>
        <input
          class="field__control"
          autocomplete="off"
          [value]="s.title"
          (input)="store.patchSection(which(), { title: valueOf($event) })"
        />
      </label>
      <label class="field">
        <span class="field__label">Descripción</span>
        <span class="field__hint">Aparece debajo del título. Puede quedar vacía.</span>
        <textarea
          class="field__control"
          rows="3"
          [value]="s.description"
          (input)="store.patchSection(which(), { description: valueOf($event) })"
        ></textarea>
      </label>
    }
  `,
  styleUrl: './fields.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionForm {
  protected readonly store = inject(StudioStore);
  protected readonly valueOf = valueOf;

  readonly which = input.required<'diplomas' | 'jobs'>();

  protected readonly section = computed(() => {
    const site = this.store.draft();
    return this.which() === 'diplomas' ? site?.certifications : site?.experience;
  });
}
