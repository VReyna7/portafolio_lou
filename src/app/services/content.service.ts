import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError } from 'rxjs';
import { SiteContent } from '../models/site-content';

/**
 * Reads the published portfolio. The editor overlay wins for projects,
 * diplomas and experience; if that request fails, the git JSON still renders.
 */
@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly http = inject(HttpClient);

  readonly content = toSignal(
    this.http.get<SiteContent>('/api/content').pipe(
      catchError(() => this.http.get<SiteContent>('content/site.json')),
    ),
  );
}
