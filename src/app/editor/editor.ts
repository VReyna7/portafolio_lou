import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { gsap, setPreviewMode, systemReducedMotion } from '../animations/gsap';
import { SiteContent } from '../models/site-content';
import { valueOf } from './dom';
import { StudioPreview, PreviewSection } from './studio-preview';
import { StudioSheet } from './studio-sheet';
import { StudioStore } from './store';
import { StudioToasts } from './studio-toasts';
import { UiIcon } from './ui-icon';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

const TIP_KEY = 'studio-tip-seen';

/** Session, saving and page chrome of `/estudio`. Editing itself lives in the store and its components. */
@Component({
  selector: 'app-editor',
  imports: [StudioPreview, StudioSheet, StudioToasts, UiIcon],
  providers: [StudioStore],
  templateUrl: './editor.html',
  // fields.css supplies the input styles used on the sign-in card; gate.css is the sign-in screen.
  styleUrls: ['./fields.css', './gate.css', './editor.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Editor {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;

  protected readonly store = inject(StudioStore);
  protected readonly valueOf = valueOf;

  protected readonly mode = signal<'checking' | 'login' | 'ready'>('checking');
  protected readonly canInstall = signal(false);
  protected readonly email = signal('');
  /** True after the sign-in link was requested; shows the "check your mail" step. */
  protected readonly sent = signal(false);
  protected readonly leaving = signal(false);
  protected readonly tip = signal(this.tipPending());

  protected readonly sections: { id: PreviewSection; label: string }[] = [
    { id: 'projects', label: 'Proyectos' },
    { id: 'experience', label: 'Experiencia' },
    { id: 'diplomas', label: 'Diplomados' },
  ];

  private readonly preview = viewChild(StudioPreview);
  protected readonly active = computed(() => this.preview()?.current() ?? 'projects');
  private installEvent: BeforeInstallPromptEvent | null = null;
  private readonly headNodes: HTMLElement[] = [];

  constructor() {
    setPreviewMode(true);
    this.mountHead();
    this.destroyRef.onDestroy(() => {
      setPreviewMode(false);
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
      this.store.notice.set('Ese enlace ya no sirve. Pide otro.');
    } else if (aviso === 'error') {
      this.store.notice.set('No se pudo abrir el enlace. Inténtalo otra vez.');
    }
    this.http
      .get<SiteContent>('/api/content', { observe: 'response', withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.enter(response.body, response.headers.get('x-content-overlay')),
        error: () => this.mode.set('login'),
      });

    // Once the first card is tapped the hint has done its job.
    effect(() => {
      if (this.store.target() && this.tip()) this.dismissTip();
    });

    // The sign-in card eases in each time it appears.
    effect(() => {
      if (this.mode() !== 'login' || this.sent()) return;
      afterNextRender(() => this.introGate(), { injector: this.injector });
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  protected warn(event: BeforeUnloadEvent): void {
    if (this.store.dirty()) event.preventDefault();
  }

  protected submitLogin(event: Event): void {
    event.preventDefault();
    const email = this.email().trim();
    if (!email || this.store.busy()) return;
    this.store.busy.set(true);
    this.store.error.set('');
    this.http
      .post<{ message: string; detail?: string }>('/api/auth/request', { email }, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (body) => {
          this.store.busy.set(false);
          this.store.notice.set(body.message);
          if (body.detail) this.store.error.set(body.detail);
          this.sent.set(true);
        },
        error: () => {
          this.store.busy.set(false);
          this.store.error.set('No se pudo enviar el enlace. Inténtalo de nuevo.');
        },
      });
  }

  protected save(): void {
    const site = this.store.draft();
    if (!site?.certifications || !site.experience || this.store.busy()) return;
    this.store.busy.set(true);
    this.store.error.set('');
    this.http
      .put<{ ok: true }>(
        '/api/content',
        { projects: site.projects, certifications: site.certifications, experience: site.experience },
        { withCredentials: true },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.store.busy.set(false);
          this.store.markSaved();
          this.store.flash('Guardado. Abre el sitio para ver los cambios.');
        },
        error: (error: HttpErrorResponse) => {
          this.store.busy.set(false);
          if (error.status === 401) {
            this.mode.set('login');
            this.sent.set(false);
            this.store.error.set('La sesión venció. Pide otro enlace.');
            return;
          }
          this.store.error.set(error.error?.error ?? 'No se pudo guardar.');
        },
      });
  }

  /** With unsaved changes the first press asks inline instead of using a blocking browser dialog. */
  protected logout(force = false): void {
    if (this.store.dirty() && !force) {
      this.leaving.set(true);
      return;
    }
    this.leaving.set(false);
    this.http.post('/api/auth/session', {}, { withCredentials: true }).subscribe({
      complete: () => {
        this.store.reset();
        this.sent.set(false);
        this.mode.set('login');
        this.store.notice.set('');
      },
    });
  }

  protected async install(): Promise<void> {
    if (!this.installEvent) return;
    await this.installEvent.prompt();
    this.canInstall.set(false);
    this.installEvent = null;
  }

  protected go(section: PreviewSection): void {
    this.preview()?.scrollTo(section);
  }

  protected countOf(section: PreviewSection): number {
    return this.store.count(section === 'projects' ? 'project' : section === 'experience' ? 'job' : 'diploma');
  }

  protected dismissTip(): void {
    this.tip.set(false);
    try {
      localStorage.setItem(TIP_KEY, '1');
    } catch {
      // Private mode: the tip simply shows again next time.
    }
  }

  private tipPending(): boolean {
    try {
      return !localStorage.getItem(TIP_KEY);
    } catch {
      return true;
    }
  }

  private introGate(): void {
    if (systemReducedMotion()) return;
    const card = this.host.querySelector('.gate__card');
    if (!card) return;
    gsap.from(card.children, {
      y: 18,
      autoAlpha: 0,
      duration: 0.5,
      stagger: 0.07,
      ease: 'power2.out',
      clearProps: 'transform,opacity,visibility',
    });
  }

  private enter(body: SiteContent | null, overlay: string | null): void {
    this.http
      .get<{ ok: boolean }>('/api/auth/session', { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          if (!session.ok) {
            this.mode.set('login');
            return;
          }
          document.title = 'Estudio';
          if (overlay === 'invalid') {
            this.mode.set('ready');
            this.store.error.set('No se pudo leer lo último guardado. No se puede editar hasta corregirlo.');
            return;
          }
          if (body) this.store.load(body);
          this.mode.set('ready');
        },
        error: () => this.mode.set('login'),
      });
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
