import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Certification,
  Evidence,
  ExperienceItem,
  ExperienceSection,
  Project,
  SiteContent,
} from '../models/site-content';
import {
  blankCertification,
  blankEvidence,
  blankExperience,
  blankProject,
  moveItem,
  uniqueSlug,
  withSections,
} from './draft';
import { uploadMedia } from './media';

type Panel = 'projects' | 'diplomas' | 'experience';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

@Component({
  selector: 'app-editor',
  templateUrl: './editor.html',
  styleUrl: './editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Editor {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly mode = signal<'checking' | 'login' | 'ready'>('checking');
  protected readonly panel = signal<Panel>('projects');
  protected readonly draft = signal<SiteContent | null>(null);
  protected readonly selected = signal(0);
  protected readonly dirty = signal(false);
  protected readonly busy = signal(false);
  protected readonly notice = signal('');
  protected readonly error = signal('');
  protected readonly canInstall = signal(false);
  protected readonly email = signal('');

  private installEvent: BeforeInstallPromptEvent | null = null;
  private readonly autoSlugs = new Set<string>();
  private readonly headNodes: HTMLElement[] = [];

  constructor() {
    this.mountHead();
    this.destroyRef.onDestroy(() => {
      for (const node of this.headNodes) node.remove();
      document.title = 'Lourdes Portales | Marketing y estrategia digital';
    });
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-editor.js').catch(() => undefined);
      window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        this.installEvent = event as BeforeInstallPromptEvent;
        this.canInstall.set(true);
      });
    }
    const aviso = new URLSearchParams(window.location.search).get('aviso');
    if (aviso === 'enlace') {
      this.notice.set('Ese enlace ya no sirve. Pide otro.');
    } else if (aviso === 'error') {
      this.notice.set('No se pudo abrir el enlace. Inténtalo otra vez.');
    }
    this.http
      .get<SiteContent>('/api/content', { observe: 'response', withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.enter(response.body, response.headers.get('x-content-overlay')),
        error: () => this.finishLoginCheck(),
      });
  }

  @HostListener('window:beforeunload', ['$event'])
  protected warn(event: BeforeUnloadEvent): void {
    if (this.dirty()) event.preventDefault();
  }

  protected submitLogin(event: Event): void {
    event.preventDefault();
    const email = this.email().trim();
    if (!email || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.http
      .post<{ message: string; detail?: string }>('/api/auth/request', { email }, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (body) => {
          this.busy.set(false);
          this.notice.set(body.message);
          if (body.detail) this.error.set(body.detail);
        },
        error: () => {
          this.busy.set(false);
          this.error.set('No se pudo enviar el enlace. Inténtalo de nuevo.');
        },
      });
  }

  protected save(): void {
    const site = this.draft();
    if (!site?.certifications || !site.experience || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.http
      .put<{ ok: true }>('/api/content', {
        projects: site.projects,
        certifications: site.certifications,
        experience: site.experience,
      }, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.dirty.set(false);
          this.notice.set('Guardado. Abre el sitio para ver los cambios.');
        },
        error: (error: HttpErrorResponse) => {
          this.busy.set(false);
          if (error.status === 401) {
            this.mode.set('login');
            this.error.set('La sesión venció. Pide otro enlace.');
            return;
          }
          this.error.set(error.error?.error ?? 'No se pudo guardar.');
        },
      });
  }

  protected logout(): void {
    if (this.dirty() && !window.confirm('Hay cambios sin guardar. ¿Salir de todos modos?')) return;
    this.http.post('/api/auth/session', {}, { withCredentials: true }).subscribe({
      complete: () => {
        this.dirty.set(false);
        this.draft.set(null);
        this.mode.set('login');
        this.notice.set('');
      },
    });
  }

  protected async install(): Promise<void> {
    if (!this.installEvent) return;
    await this.installEvent.prompt();
    this.canInstall.set(false);
    this.installEvent = null;
  }

  protected choose(panel: Panel): void {
    this.panel.set(panel);
    this.selected.set(0);
  }

  protected text(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  protected addProject(): void {
    this.update((site) => {
      const project = blankProject(site.projects.map((item) => item.slug));
      this.autoSlugs.add(project.slug);
      this.selected.set(site.projects.length);
      return { ...site, projects: [...site.projects, project] };
    });
  }

  protected renameProject(index: number, title: string): void {
    this.update((site) => ({
      ...site,
      projects: site.projects.map((project, i) => {
        if (i !== index) return project;
        if (!this.autoSlugs.has(project.slug)) return { ...project, title };
        const slug = uniqueSlug(title || 'proyecto', site.projects.filter((_, j) => j !== i).map((item) => item.slug));
        this.autoSlugs.delete(project.slug);
        this.autoSlugs.add(slug);
        return { ...project, title, slug };
      }),
    }));
  }

  protected patchProject(index: number, patch: Partial<Project>): void {
    this.update((site) => ({
      ...site,
      projects: site.projects.map((project, i) => (i === index ? { ...project, ...patch } : project)),
    }));
  }

  protected setTasks(index: number, value: string): void {
    this.patchProject(index, { tasks: value.split('\n') });
  }

  protected moveProject(index: number, direction: -1 | 1): void {
    this.update((site) => {
      const projects = moveItem(site.projects, index, direction);
      this.selected.set(Math.max(0, index + direction));
      return { ...site, projects };
    });
  }

  protected removeProject(index: number): void {
    const title = this.draft()?.projects[index]?.title || 'este proyecto';
    if (!window.confirm(`¿Quitar ${title}?`)) return;
    this.update((site) => {
      this.selected.set(Math.max(0, index - 1));
      return { ...site, projects: site.projects.filter((_, i) => i !== index) };
    });
  }

  protected addEvidence(index: number): void {
    this.patchProject(index, { evidence: [...(this.project(index)?.evidence ?? []), blankEvidence()] });
  }

  protected patchEvidence(projectIndex: number, evidenceIndex: number, patch: Partial<Evidence>): void {
    const evidence = (this.project(projectIndex)?.evidence ?? []).map((item, i) =>
      i === evidenceIndex ? { ...item, ...patch } : item,
    );
    this.patchProject(projectIndex, { evidence });
  }

  protected moveEvidence(projectIndex: number, evidenceIndex: number, direction: -1 | 1): void {
    this.patchProject(projectIndex, {
      evidence: moveItem(this.project(projectIndex)?.evidence ?? [], evidenceIndex, direction),
    });
  }

  protected removeEvidence(projectIndex: number, evidenceIndex: number): void {
    this.patchProject(projectIndex, {
      evidence: (this.project(projectIndex)?.evidence ?? []).filter((_, i) => i !== evidenceIndex),
    });
  }

  protected addCertification(): void {
    this.update((site) => {
      const certifications = this.certs(site);
      this.selected.set(certifications.items.length);
      return { ...site, certifications: { ...certifications, items: [...certifications.items, blankCertification()] } };
    });
  }

  protected patchCertification(index: number, patch: Partial<Certification>): void {
    this.update((site) => {
      const certifications = this.certs(site);
      return {
        ...site,
        certifications: {
          ...certifications,
          items: certifications.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
        },
      };
    });
  }

  protected moveCertification(index: number, direction: -1 | 1): void {
    this.update((site) => {
      const certifications = this.certs(site);
      this.selected.set(Math.max(0, index + direction));
      return { ...site, certifications: { ...certifications, items: moveItem(certifications.items, index, direction) } };
    });
  }

  protected removeCertification(index: number): void {
    if (!window.confirm('¿Quitar este diplomado?')) return;
    this.update((site) => {
      const certifications = this.certs(site);
      this.selected.set(Math.max(0, index - 1));
      return { ...site, certifications: { ...certifications, items: certifications.items.filter((_, i) => i !== index) } };
    });
  }

  protected patchCertificationSection(patch: Partial<SiteContent['certifications']>): void {
    this.update((site) => ({ ...site, certifications: { ...this.certs(site), ...patch } }));
  }

  protected addExperience(): void {
    this.update((site) => {
      const experience = this.jobs(site);
      this.selected.set(experience.items.length);
      return { ...site, experience: { ...experience, items: [...experience.items, blankExperience()] } };
    });
  }

  protected patchExperience(index: number, patch: Partial<ExperienceItem>): void {
    this.update((site) => {
      const experience = this.jobs(site);
      return {
        ...site,
        experience: {
          ...experience,
          items: experience.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
        },
      };
    });
  }

  protected moveExperience(index: number, direction: -1 | 1): void {
    this.update((site) => {
      const experience = this.jobs(site);
      this.selected.set(Math.max(0, index + direction));
      return { ...site, experience: { ...experience, items: moveItem(experience.items, index, direction) } };
    });
  }

  protected removeExperience(index: number): void {
    if (!window.confirm('¿Quitar esta experiencia?')) return;
    this.update((site) => {
      const experience = this.jobs(site);
      this.selected.set(Math.max(0, index - 1));
      return { ...site, experience: { ...experience, items: experience.items.filter((_, i) => i !== index) } };
    });
  }

  protected patchExperienceSection(patch: Partial<ExperienceSection>): void {
    this.update((site) => ({ ...site, experience: { ...this.jobs(site), ...patch } }));
  }

  protected uploadCover(event: Event, index: number): void {
    void this.onFile(event, (url) => this.patchProject(index, { cover: url }));
  }

  protected uploadEvidenceFile(
    event: Event,
    projectIndex: number,
    evidenceIndex: number,
    field: 'image' | 'video' | 'poster',
  ): void {
    void this.onFile(event, (url) => this.patchEvidence(projectIndex, evidenceIndex, { [field]: url }));
  }

  protected uploadDiploma(event: Event, index: number): void {
    void this.onFile(event, (url) => this.patchCertification(index, { image: url }));
  }

  protected num(event: Event): number {
    return Number(this.text(event));
  }

  protected async onFile(event: Event, apply: (url: string) => void): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.busy.set(true);
    this.error.set('');
    try {
      apply(await uploadMedia(file));
    } catch (error) {
      const text = error instanceof Error ? error.message : '';
      this.error.set(text.startsWith('Usa ') || text.startsWith('El archivo') ? text : 'No se pudo subir el archivo.');
    } finally {
      this.busy.set(false);
    }
  }

  protected project(index: number): Project | undefined {
    return this.draft()?.projects[index];
  }

  protected tasksOf(project: Project): string {
    return (project.tasks ?? []).join('\n');
  }

  private enter(body: SiteContent | null, overlay: string | null): void {
    this.http
      .get<{ ok: boolean }>('/api/auth/session', { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          document.title = 'Editar portafolio';
          if (overlay === 'invalid') {
            this.mode.set('ready');
            this.error.set('No se pudo leer lo último guardado. No se puede editar hasta corregirlo.');
            return;
          }
          if (body) this.draft.set(structuredClone(withSections(body)));
          this.mode.set('ready');
        },
        error: () => this.finishLoginCheck(),
      });
  }

  private finishLoginCheck(): void {
    this.mode.set('login');
  }

  private update(mutator: (site: SiteContent) => SiteContent): void {
    const current = this.draft();
    if (!current) return;
    this.draft.set(mutator(current));
    this.dirty.set(true);
    this.notice.set('');
  }

  private certs(site: SiteContent): NonNullable<SiteContent['certifications']> {
    return site.certifications ?? { title: 'Diplomados y certificaciones', description: '', items: [] };
  }

  private jobs(site: SiteContent): ExperienceSection {
    return site.experience ?? { title: 'Experiencia', description: '', items: [] };
  }

  private mountHead(): void {
    document.title = 'Entrar';
    this.addMeta('robots', 'noindex, nofollow');
    this.addMeta('referrer', 'no-referrer');
    const manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = '/panel.webmanifest';
    document.head.appendChild(manifest);
    this.headNodes.push(manifest);
    const apple = document.createElement('link');
    apple.rel = 'apple-touch-icon';
    apple.href = '/editor-icon-192.png';
    document.head.appendChild(apple);
    this.headNodes.push(apple);
    this.addMeta('apple-mobile-web-app-capable', 'yes');
    this.addMeta('apple-mobile-web-app-title', 'Editar');
  }

  private addMeta(name: string, content: string): void {
    const meta = document.createElement('meta');
    meta.name = name;
    meta.content = content;
    document.head.appendChild(meta);
    this.headNodes.push(meta);
  }
}
