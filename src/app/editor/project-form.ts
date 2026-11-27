import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { checkedOf, valueOf } from './dom';
import { FileField } from './file-field';
import { StudioStore } from './store';
import { UiIcon } from './ui-icon';

type Tab = 'info' | 'evidence' | 'style';

/** Preset brand-friendly accents; a custom color stays available for anything else. */
const SWATCHES = ['#8a1f2b', '#1b6fa8', '#0b3d91', '#7b2cbf', '#14532d', '#b45309', '#be185d', '#0f766e'];

const RATIOS = [
  { value: '3 / 4', label: 'Vertical (3 / 4)' },
  { value: '9 / 16', label: 'Reel vertical (9 / 16)' },
  { value: '1 / 1', label: 'Cuadrado (1 / 1)' },
  { value: '16 / 9', label: 'Horizontal (16 / 9)' },
];

const SPEEDS = [
  { value: 0.5, label: 'Lento (0.5x)' },
  { value: 0.75, label: 'Un poco lento (0.75x)' },
  { value: 1, label: 'Normal' },
  { value: 1.25, label: 'Un poco rápido (1.25x)' },
  { value: 1.5, label: 'Rápido (1.5x)' },
  { value: 2, label: 'Muy rápido (2x)' },
];

const CATEGORIES = ['Marca y branding', 'Redes sociales y contenido audiovisual', 'Comunicación y eventos'];

@Component({
  selector: 'app-project-form',
  imports: [FileField, UiIcon],
  templateUrl: './project-form.html',
  styleUrls: ['./fields.css', './project-form.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectForm {
  protected readonly store = inject(StudioStore);
  protected readonly valueOf = valueOf;
  protected readonly checkedOf = checkedOf;
  protected readonly swatches = SWATCHES;
  protected readonly speeds = SPEEDS;
  protected readonly categories = CATEGORIES;

  readonly index = input.required<number>();

  protected readonly project = computed(() => this.store.draft()?.projects[this.index()]);
  protected readonly tab = signal<Tab>('info');
  /** Which evidence card is expanded; only one at a time keeps the panel short. */
  protected readonly open = signal<number | null>(null);

  constructor() {
    // A different project starts again on the first tab with everything collapsed.
    effect(() => {
      this.index();
      untracked(() => {
        this.tab.set('info');
        this.open.set(null);
      });
    });
  }

  protected tasksText(tasks: string[] | undefined): string {
    return (tasks ?? []).join('\n');
  }

  protected toggle(evidenceIndex: number): void {
    this.open.update((current) => (current === evidenceIndex ? null : evidenceIndex));
  }

  protected addEvidence(): void {
    this.open.set(this.store.addEvidence(this.index()));
  }

  protected removeEvidence(evidenceIndex: number): void {
    this.open.set(null);
    this.store.removeEvidence(this.index(), evidenceIndex);
  }

  protected moveEvidence(evidenceIndex: number, direction: -1 | 1): void {
    this.store.moveEvidence(this.index(), evidenceIndex, direction);
    this.open.set(evidenceIndex + direction);
  }

  /** Keeps a value that came from older content (for example "2 / 3") selectable. */
  protected ratios(current: string | undefined): { value: string; label: string }[] {
    if (!current || RATIOS.some((ratio) => ratio.value === current)) return RATIOS;
    return [...RATIOS, { value: current, label: `Personalizada (${current})` }];
  }

  protected setSpeed(evidenceIndex: number, value: string): void {
    this.store.patchEvidence(this.index(), evidenceIndex, { speed: Number(value) });
  }
}
