import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./portfolio/portfolio').then((m) => m.Portfolio),
  },
  {
    // Unlisted. The public pages do not link here; the email link is what grants entry.
    path: 'estudio',
    loadComponent: () => import('./editor/editor').then((m) => m.Editor),
  },
];
