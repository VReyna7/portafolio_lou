import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { inject as injectAnalytics } from '@vercel/analytics';
import { Certifications } from './components/certifications/certifications';
import { Contact } from './components/contact/contact';
import { Hero } from './components/hero/hero';
import { Projects } from './components/projects/projects';
import { Tools } from './components/tools/tools';
import { ContentService } from './services/content.service';

@Component({
  selector: 'app-root',
  imports: [Hero, Tools, Projects, Contact, Certifications],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly content = inject(ContentService).content;
  protected readonly year = new Date().getFullYear();

  constructor() {
    // Initialize Vercel Analytics (browser only)
    if (typeof window !== 'undefined') {
      injectAnalytics();
    }
  }
}
