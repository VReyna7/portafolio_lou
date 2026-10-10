import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ToolsSection } from '../../models/site-content';

@Component({
  selector: 'app-tools',
  templateUrl: './tools.html',
  styleUrl: './tools.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Tools {
  readonly tools = input.required<ToolsSection>();
}
