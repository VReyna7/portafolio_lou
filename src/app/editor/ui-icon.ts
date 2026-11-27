import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const PATHS = {
  plus: 'M12 5v14M5 12h14',
  left: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  up: 'M6 15l6-6 6 6',
  down: 'M6 9l6 6 6-6',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12.5l4.5 4.5L19 7',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z',
  logout: 'M9 4H5v16h4M16 8l4 4-4 4M20 12H9',
  image: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M9 9.5h.01',
  video: 'M3 6h13v12H3zM16 10l5-3v10l-5-3',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3',
  pencil: 'M4 20l1-4L16 5l3 3L8 19zM14 7l3 3',
  install: 'M12 3v12M7 10l5 5 5-5M5 20h14',
  expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  mail: 'M3 6h18v12H3zM3 7l9 7 9-7',
} as const;

export type UiIconName = keyof typeof PATHS;

/** Local outline icons for the studio chrome (the site's own icons live in components/icon). */
@Component({
  selector: 'app-ui-icon',
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path [attr.d]="path()" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      width: 1.25em;
      height: 1.25em;
      flex: none;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiIcon {
  readonly name = input.required<UiIconName>();
  protected readonly path = computed(() => PATHS[this.name()]);
}
