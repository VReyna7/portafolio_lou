import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CategoryIcon, ToolIcon } from '../../icons/tool-icons';

/** Shared outline icons for tools and project categories. */
@Component({
  selector: 'app-icon',
  templateUrl: './icon.html',
  styleUrl: './icon.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Icon {
  readonly name = input.required<ToolIcon | CategoryIcon>();
}
