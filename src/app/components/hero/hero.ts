import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Profile } from '../../models/site-content';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.html',
  styleUrl: './hero.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Hero {
  readonly profile = input.required<Profile>();

  protected readonly initials = computed(() =>
    this.profile()
      .name.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
  );
}
