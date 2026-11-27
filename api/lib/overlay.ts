/**
 * Checks the three collections Lourdes can edit.
 * Profile, tools and contact stay in public/content/site.json and are ignored here.
 * Field names match src/app/models/site-content.ts.
 */

export interface Evidence {
  title: string;
  description: string;
  image: string;
  video?: string;
  poster?: string;
  speed?: number;
  ratio?: string;
  sound?: boolean;
}

export interface Project {
  slug: string;
  title: string;
  category: string;
  summary: string;
  cover: string;
  role: string;
  tasks?: string[];
  description: string;
  driveUrl: string;
  accent: string;
  evidence: Evidence[];
}

export interface Certification {
  title: string;
  issuer: string;
  year?: string;
  image: string;
}

export interface CertificationsSection {
  title: string;
  description: string;
  items: Certification[];
}

export interface ExperienceItem {
  role: string;
  place: string;
  start: string;
  end: string;
  description: string;
}

export interface ExperienceSection {
  title: string;
  description: string;
  items: ExperienceItem[];
}

export interface Overlay {
  projects: Project[];
  certifications: CertificationsSection;
  experience: ExperienceSection;
}

type Parsed = { ok: true; value: Overlay } | { ok: false; error: string };

const MAX_PROJECTS = 40;
const MAX_EVIDENCE = 12;
const MAX_TASKS = 20;
const MAX_ITEMS = 40;

function text(value: unknown, max: number, label: string): string | Parsed {
  if (typeof value !== 'string') {
    return { ok: false, error: `${label} debe ser texto.` };
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    return { ok: false, error: `${label} es demasiado largo.` };
  }
  return trimmed;
}

function fail(result: string | Parsed): result is Parsed {
  return typeof result !== 'string';
}

function asset(value: unknown, label: string): string | Parsed {
  const parsed = text(value, 500, label);
  if (fail(parsed)) {
    return parsed;
  }
  if (!parsed) {
    return '';
  }
  if (parsed.startsWith('https://')) {
    try {
      const url = new URL(parsed);
      return url.protocol === 'https:' ? url.toString() : { ok: false, error: `${label} debe ser un enlace seguro.` };
    } catch {
      return { ok: false, error: `${label} no es un enlace válido.` };
    }
  }
  if (parsed.includes('..') || parsed.includes('\\') || parsed.includes('://') || parsed.startsWith('/')) {
    return { ok: false, error: `${label} no es una ruta válida.` };
  }
  if (!/^[a-zA-Z0-9._\-/]+$/.test(parsed)) {
    return { ok: false, error: `${label} no es una ruta válida.` };
  }
  return parsed;
}

function optionalAsset(value: unknown, label: string): string | undefined | Parsed {
  if (value == null || value === '') {
    return undefined;
  }
  const parsed = asset(value, label);
  if (fail(parsed)) {
    return parsed;
  }
  return parsed || undefined;
}

export function parseOverlay(input: unknown): Parsed {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'El contenido no tiene el formato esperado.' };
  }
  const body = input as Record<string, unknown>;
  const projects = parseProjects(body['projects']);
  if (!Array.isArray(projects)) {
    return projects;
  }
  const certifications = parseCertifications(body['certifications']);
  if (!('items' in certifications)) {
    return certifications;
  }
  const experience = parseExperience(body['experience']);
  if (!('items' in experience)) {
    return experience;
  }
  return { ok: true, value: { projects, certifications, experience } };
}

function parseProjects(input: unknown): Project[] | Parsed {
  if (!Array.isArray(input)) {
    return { ok: false, error: 'Falta la lista de proyectos.' };
  }
  if (input.length > MAX_PROJECTS) {
    return { ok: false, error: 'Hay demasiados proyectos.' };
  }
  const projects: Project[] = [];
  const slugs = new Set<string>();
  for (const item of input) {
    const project = parseProject(item);
    if (!('slug' in project)) {
      return project;
    }
    if (slugs.has(project.slug)) {
      return { ok: false, error: 'Hay dos proyectos con el mismo identificador.' };
    }
    slugs.add(project.slug);
    projects.push(project);
  }
  return projects;
}

function parseProject(input: unknown): Project | Parsed {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Un proyecto no tiene el formato esperado.' };
  }
  const item = input as Record<string, unknown>;
  const slug = text(item['slug'], 60, 'El identificador del proyecto');
  if (fail(slug)) return slug;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { ok: false, error: 'El identificador del proyecto solo puede usar minúsculas y guiones.' };
  }
  const title = text(item['title'], 120, 'El título del proyecto');
  if (fail(title)) return title;
  if (!title) return { ok: false, error: 'Cada proyecto necesita un título.' };
  const category = text(item['category'], 80, 'La categoría');
  if (fail(category)) return category;
  const summary = text(item['summary'], 280, 'El resumen');
  if (fail(summary)) return summary;
  const cover = asset(item['cover'], 'La portada');
  if (fail(cover)) return cover;
  const role = text(item['role'], 500, 'El rol');
  if (fail(role)) return role;
  const description = text(item['description'], 4000, 'La descripción del proyecto');
  if (fail(description)) return description;
  const drive = asset(item['driveUrl'] ?? '', 'El enlace del material');
  if (fail(drive)) return drive;
  const accent = text(item['accent'], 7, 'El color');
  if (fail(accent) || !/^#[0-9a-fA-F]{6}$/.test(accent)) {
    return { ok: false, error: 'El color del proyecto debe ser un código como #7b2cbf.' };
  }
  const tasks = parseTasks(item['tasks']);
  if (!Array.isArray(tasks)) return tasks;
  const evidence = parseEvidence(item['evidence']);
  if (!Array.isArray(evidence)) return evidence;
  const project: Project = {
    slug,
    title,
    category,
    summary,
    cover,
    role,
    description,
    driveUrl: drive,
    accent: accent.toLowerCase(),
    evidence,
  };
  if (tasks.length) {
    project.tasks = tasks;
  }
  return project;
}

function parseTasks(input: unknown): string[] | Parsed {
  if (input == null) return [];
  if (!Array.isArray(input)) return { ok: false, error: 'Las funciones del proyecto deben ser una lista.' };
  if (input.length > MAX_TASKS) return { ok: false, error: 'Un proyecto tiene demasiadas funciones.' };
  const tasks: string[] = [];
  for (const item of input) {
    const line = text(item, 200, 'Una función');
    if (fail(line)) return line;
    if (line) tasks.push(line);
  }
  return tasks;
}

function parseEvidence(input: unknown): Evidence[] | Parsed {
  if (!Array.isArray(input)) return { ok: false, error: 'Faltan las evidencias de un proyecto.' };
  if (input.length > MAX_EVIDENCE) return { ok: false, error: 'Un proyecto tiene demasiadas evidencias.' };
  const evidence: Evidence[] = [];
  for (const item of input) {
    const parsed = parseEvidenceItem(item);
    if (!('title' in parsed)) return parsed;
    evidence.push(parsed);
  }
  return evidence;
}

function parseEvidenceItem(input: unknown): Evidence | Parsed {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Una evidencia no tiene el formato esperado.' };
  }
  const item = input as Record<string, unknown>;
  const title = text(item['title'], 120, 'El título de la evidencia');
  if (fail(title)) return title;
  if (!title) return { ok: false, error: 'Cada evidencia necesita un título.' };
  const description = text(item['description'], 600, 'La descripción de la evidencia');
  if (fail(description)) return description;
  const image = asset(item['image'] ?? '', 'La imagen de la evidencia');
  if (fail(image)) return image;
  const video = optionalAsset(item['video'], 'El video');
  if (typeof video !== 'string' && video !== undefined) return video;
  const poster = optionalAsset(item['poster'], 'El póster del video');
  if (typeof poster !== 'string' && poster !== undefined) return poster;
  const evidence: Evidence = { title, description, image };
  if (video) evidence.video = video;
  if (poster) evidence.poster = poster;
  if (item['speed'] != null && item['speed'] !== '') {
    const speed = Number(item['speed']);
    if (!Number.isFinite(speed) || speed < 0.25 || speed > 3) {
      return { ok: false, error: 'La velocidad del video debe estar entre 0.25 y 3.' };
    }
    evidence.speed = speed;
  }
  if (item['ratio'] != null && item['ratio'] !== '') {
    const ratio = text(item['ratio'], 20, 'La proporción del video');
    if (fail(ratio) || !/^\d{1,2}\s*\/\s*\d{1,2}$/.test(ratio)) {
      return { ok: false, error: 'La proporción del video debe verse como 9 / 16.' };
    }
    evidence.ratio = ratio.replace(/\s+/g, ' ');
  }
  if (item['sound'] === true) evidence.sound = true;
  return evidence;
}

function parseCertifications(input: unknown): CertificationsSection | Parsed {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Falta la sección de diplomados.' };
  }
  const body = input as Record<string, unknown>;
  const title = text(body['title'], 120, 'El título de diplomados');
  if (fail(title)) return title;
  const description = text(body['description'] ?? '', 400, 'La descripción de diplomados');
  if (fail(description)) return description;
  if (!Array.isArray(body['items'])) return { ok: false, error: 'Falta la lista de diplomados.' };
  if (body['items'].length > MAX_ITEMS) return { ok: false, error: 'Hay demasiados diplomados.' };
  const items: Certification[] = [];
  for (const item of body['items']) {
    const parsed = parseCertification(item);
    if (!('title' in parsed)) return parsed;
    items.push(parsed);
  }
  return { title: title || 'Diplomados y certificaciones', description, items };
}

function parseCertification(input: unknown): Certification | Parsed {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Un diplomado no tiene el formato esperado.' };
  }
  const item = input as Record<string, unknown>;
  const title = text(item['title'], 160, 'El título del diplomado');
  if (fail(title)) return title;
  if (!title) return { ok: false, error: 'Cada diplomado necesita un título.' };
  const issuer = text(item['issuer'], 120, 'La institución');
  if (fail(issuer)) return issuer;
  if (!issuer) return { ok: false, error: 'Cada diplomado necesita la institución.' };
  const image = asset(item['image'] ?? '', 'La foto del diplomado');
  if (fail(image)) return image;
  const certification: Certification = { title, issuer, image };
  if (item['year'] != null && item['year'] !== '') {
    const year = text(item['year'], 20, 'El año');
    if (fail(year)) return year;
    if (year) certification.year = year;
  }
  return certification;
}

function parseExperience(input: unknown): ExperienceSection | Parsed {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Falta la sección de experiencia.' };
  }
  const body = input as Record<string, unknown>;
  const title = text(body['title'], 120, 'El título de experiencia');
  if (fail(title)) return title;
  const description = text(body['description'] ?? '', 400, 'La descripción de experiencia');
  if (fail(description)) return description;
  if (!Array.isArray(body['items'])) return { ok: false, error: 'Falta la lista de experiencia.' };
  if (body['items'].length > MAX_ITEMS) return { ok: false, error: 'Hay demasiadas experiencias.' };
  const items: ExperienceItem[] = [];
  for (const item of body['items']) {
    const parsed = parseExperienceItem(item);
    if (!('role' in parsed)) return parsed;
    items.push(parsed);
  }
  return { title: title || 'Experiencia', description, items };
}

function parseExperienceItem(input: unknown): ExperienceItem | Parsed {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Una experiencia no tiene el formato esperado.' };
  }
  const item = input as Record<string, unknown>;
  const role = text(item['role'], 120, 'El puesto');
  if (fail(role)) return role;
  if (!role) return { ok: false, error: 'Cada experiencia necesita el puesto.' };
  const place = text(item['place'], 120, 'El lugar');
  if (fail(place)) return place;
  if (!place) return { ok: false, error: 'Cada experiencia necesita el lugar.' };
  const start = text(item['start'] ?? '', 40, 'La fecha de inicio');
  if (fail(start)) return start;
  const end = text(item['end'] ?? '', 40, 'La fecha de cierre');
  if (fail(end)) return end;
  const description = text(item['description'] ?? '', 800, 'La descripción de la experiencia');
  if (fail(description)) return description;
  return { role, place, start, end, description };
}
