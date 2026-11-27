import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import {
  Certification,
  CertificationsSection,
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

export type ItemKind = 'project' | 'diploma' | 'job';
export type SectionKind = 'diplomas-section' | 'jobs-section';

/** What the side panel is editing. Section targets always use index 0. */
export interface Target {
  kind: ItemKind | SectionKind;
  index: number;
}

interface ItemMap {
  project: Project;
  diploma: Certification;
  job: ExperienceItem;
}

interface Accessor<T> {
  get: (site: SiteContent) => T[];
  set: (site: SiteContent, items: T[]) => SiteContent;
  blank: (site: SiteContent) => T;
  /** Shown in the undo toast, e.g. "Quitaste el proyecto". */
  removed: string;
}

const certs = (site: SiteContent): CertificationsSection =>
  site.certifications ?? { title: 'Diplomados y certificaciones', description: '', items: [] };

const jobs = (site: SiteContent): ExperienceSection =>
  site.experience ?? { title: 'Experiencia', description: '', items: [] };

/**
 * One accessor per list kind, so add/patch/move/remove are written once.
 * Adding a new editable list only means adding an entry here.
 */
const ACCESSORS: { [K in ItemKind]: Accessor<ItemMap[K]> } = {
  project: {
    get: (site) => site.projects,
    set: (site, projects) => ({ ...site, projects }),
    blank: (site) => blankProject(site.projects.map((item) => item.slug)),
    removed: 'Quitaste el proyecto.',
  },
  diploma: {
    get: (site) => certs(site).items,
    set: (site, items) => ({ ...site, certifications: { ...certs(site), items } }),
    blank: () => blankCertification(),
    removed: 'Quitaste el diplomado.',
  },
  job: {
    get: (site) => jobs(site).items,
    set: (site, items) => ({ ...site, experience: { ...jobs(site), items } }),
    blank: () => blankExperience(),
    removed: 'Quitaste la experiencia.',
  },
};

function access<K extends ItemKind>(kind: K): Accessor<ItemMap[K]> {
  return ACCESSORS[kind] as unknown as Accessor<ItemMap[K]>;
}

/** Draft, selection and every edit operation of the studio. Provided by `Editor`, so it dies with the page. */
@Injectable()
export class StudioStore {
  readonly draft = signal<SiteContent | null>(null);
  readonly target = signal<Target | null>(null);
  readonly dirty = signal(false);
  readonly busy = signal(false);
  readonly notice = signal('');
  readonly error = signal('');
  /** Text of the pending undo, or empty when there is nothing to undo. */
  readonly undoText = signal('');
  /** Pixels of the preview covered by the bottom sheet; the preview pads itself by this amount. */
  readonly overlay = signal(0);
  /** Counters that other components watch to move focus without sharing element references. */
  readonly focusPanel = signal(0);
  readonly focusPicked = signal(0);

  private readonly autoSlugs = new Set<string>();
  private snapshot: { site: SiteContent; target: Target | null } | null = null;
  private noticeTimer: ReturnType<typeof setTimeout> | undefined;
  private undoTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.noticeTimer);
      clearTimeout(this.undoTimer);
    });
  }

  load(site: SiteContent): void {
    this.draft.set(structuredClone(withSections(site)));
    this.dirty.set(false);
    this.target.set(null);
  }

  reset(): void {
    this.draft.set(null);
    this.target.set(null);
    this.dirty.set(false);
    this.clearUndo();
  }

  markSaved(): void {
    this.dirty.set(false);
  }

  /** Short confirmation that fades by itself. */
  flash(text: string): void {
    clearTimeout(this.noticeTimer);
    this.notice.set(text);
    this.noticeTimer = setTimeout(() => this.notice.set(''), 5000);
  }

  select(target: Target, moveFocus = false): void {
    this.target.set(target);
    if (moveFocus) this.focusPanel.update((n) => n + 1);
  }

  close(returnFocus = false): void {
    this.target.set(null);
    if (returnFocus) this.focusPicked.update((n) => n + 1);
  }

  item<K extends ItemKind>(kind: K, index: number): ItemMap[K] | undefined {
    const site = this.draft();
    return site ? access(kind).get(site)[index] : undefined;
  }

  count(kind: ItemKind): number {
    const site = this.draft();
    return site ? access(kind).get(site).length : 0;
  }

  add(kind: ItemKind): void {
    const current = this.draft();
    if (!current) return;
    const accessor = access(kind);
    const index = accessor.get(current).length;
    const blank = accessor.blank(current);
    if (kind === 'project') this.autoSlugs.add((blank as Project).slug);
    this.update((site) => accessor.set(site, [...accessor.get(site), blank]));
    this.select({ kind, index }, true);
  }

  patch<K extends ItemKind>(kind: K, index: number, patch: Partial<ItemMap[K]>): void {
    const accessor = access(kind);
    this.update((site) =>
      accessor.set(
        site,
        accessor.get(site).map((item, i) => (i === index ? ({ ...item, ...patch } as ItemMap[K]) : item)),
      ),
    );
  }

  move(kind: ItemKind, index: number, direction: -1 | 1): void {
    const accessor = access(kind);
    const length = this.count(kind);
    this.update((site) => accessor.set(site, moveItem(accessor.get(site), index, direction)));
    const next = Math.min(Math.max(index + direction, 0), length - 1);
    this.target.set({ kind, index: next });
  }

  remove(kind: ItemKind, index: number): void {
    const accessor = access(kind);
    this.update((site) => accessor.set(site, accessor.get(site).filter((_, i) => i !== index)), accessor.removed);
    this.target.set(null);
  }

  /** A project's slug follows its title until the slug is edited elsewhere, as before. */
  renameProject(index: number, title: string): void {
    this.update((site) => ({
      ...site,
      projects: site.projects.map((project, i) => {
        if (i !== index) return project;
        if (!this.autoSlugs.has(project.slug)) return { ...project, title };
        const taken = site.projects.filter((_, j) => j !== i).map((item) => item.slug);
        const slug = uniqueSlug(title || 'proyecto', taken);
        this.autoSlugs.delete(project.slug);
        this.autoSlugs.add(slug);
        return { ...project, title, slug };
      }),
    }));
  }

  setTasks(index: number, value: string): void {
    this.patch('project', index, { tasks: value.split('\n') });
  }

  patchSection(section: 'diplomas' | 'jobs', patch: Partial<Pick<ExperienceSection, 'title' | 'description'>>): void {
    this.update((site) =>
      section === 'diplomas'
        ? { ...site, certifications: { ...certs(site), ...patch } }
        : { ...site, experience: { ...jobs(site), ...patch } },
    );
  }

  addEvidence(projectIndex: number): number {
    const list = this.item('project', projectIndex)?.evidence ?? [];
    this.patch('project', projectIndex, { evidence: [...list, blankEvidence()] });
    return list.length;
  }

  patchEvidence(projectIndex: number, evidenceIndex: number, patch: Partial<Evidence>): void {
    const list = (this.item('project', projectIndex)?.evidence ?? []).map((item, i) =>
      i === evidenceIndex ? { ...item, ...patch } : item,
    );
    this.patch('project', projectIndex, { evidence: list });
  }

  moveEvidence(projectIndex: number, evidenceIndex: number, direction: -1 | 1): void {
    const list = this.item('project', projectIndex)?.evidence ?? [];
    this.patch('project', projectIndex, { evidence: moveItem(list, evidenceIndex, direction) });
  }

  removeEvidence(projectIndex: number, evidenceIndex: number): void {
    const list = (this.item('project', projectIndex)?.evidence ?? []).filter((_, i) => i !== evidenceIndex);
    this.update(
      (site) => ({
        ...site,
        projects: site.projects.map((project, i) => (i === projectIndex ? { ...project, evidence: list } : project)),
      }),
      'Quitaste la evidencia.',
    );
  }

  undo(): void {
    if (!this.snapshot) return;
    this.draft.set(this.snapshot.site);
    this.target.set(this.snapshot.target);
    this.dirty.set(true);
    this.clearUndo();
  }

  clearUndo(): void {
    clearTimeout(this.undoTimer);
    this.snapshot = null;
    this.undoText.set('');
  }

  /** Uploads one file and hands the public URL to `apply`; errors become the toast message. */
  async attach(file: File, apply: (url: string) => void): Promise<void> {
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

  /** Any edit marks the draft dirty; removals also keep a snapshot so they can be undone. */
  private update(mutator: (site: SiteContent) => SiteContent, undoText?: string): void {
    const current = this.draft();
    if (!current) return;
    if (undoText) {
      this.clearUndo();
      this.snapshot = { site: current, target: this.target() };
      this.undoText.set(undoText);
      this.undoTimer = setTimeout(() => this.clearUndo(), 9000);
    } else {
      this.clearUndo();
    }
    this.draft.set(mutator(current));
    this.dirty.set(true);
    this.notice.set('');
  }
}
