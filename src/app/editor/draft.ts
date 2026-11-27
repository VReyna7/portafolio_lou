import { Certification, Evidence, ExperienceItem, Project, SiteContent } from '../models/site-content';

export function slugify(value: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || 'proyecto';
}

export function uniqueSlug(title: string, taken: string[]): string {
  const base = slugify(title);
  if (!taken.includes(base)) {
    return base;
  }
  let n = 2;
  while (taken.includes(`${base}-${n}`)) {
    n += 1;
  }
  return `${base}-${n}`;
}

export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) {
    return items;
  }
  const next = items.slice();
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

export function blankProject(taken: string[]): Project {
  return {
    slug: uniqueSlug('proyecto', taken),
    title: '',
    category: '',
    summary: '',
    cover: '',
    role: '',
    description: '',
    driveUrl: '',
    accent: '#7b2cbf',
    evidence: [],
  };
}

export function blankEvidence(): Evidence {
  return { title: '', description: '', image: '' };
}

export function blankCertification(): Certification {
  return { title: '', issuer: '', year: '', image: '' };
}

export function blankExperience(): ExperienceItem {
  return { role: '', place: '', start: '', end: '', description: '' };
}

/** The form always has the two optional sections, even when the public page hides them. */
export function withSections(site: SiteContent): SiteContent {
  return {
    ...site,
    certifications: site.certifications ?? {
      title: 'Diplomados y certificaciones',
      description: 'Formación complementaria que respalda mi trabajo en marketing y comunicación.',
      items: [],
    },
    experience: site.experience ?? {
      title: 'Experiencia',
      description: 'Lugares donde he trabajado y lo que hice en cada uno.',
      items: [],
    },
  };
}
