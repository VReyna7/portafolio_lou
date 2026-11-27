import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Reveal } from '../../animations/reveal.directive';
import { ToolsSection } from '../../models/site-content';

@Component({
  selector: 'app-tools',
  imports: [Reveal],
  templateUrl: './tools.html',
  styleUrl: './tools.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Tools {
  readonly tools = input.required<ToolsSection>();
}
