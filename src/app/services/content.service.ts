import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SiteContent } from '../models/site-content';

/**
 * Reads the editable portfolio content from public/content/site.json.
 * Loaded at runtime so editing the JSON never requires touching code.
 */
@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly http = inject(HttpClient);

  readonly content = toSignal(this.http.get<SiteContent>('content/site.json'));
}
